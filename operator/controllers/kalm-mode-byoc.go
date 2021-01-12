package controllers

import (
	"bytes"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/kalmhq/kalm/controller/api/v1alpha1"
	installv1alpha1 "github.com/kalmhq/kalm/operator/api/v1alpha1"
	v1 "k8s.io/api/core/v1"
	"sigs.k8s.io/controller-runtime/pkg/client"
)

func (r *KalmOperatorConfigReconciler) reconcileBYOCMode(config *installv1alpha1.KalmOperatorConfig) error {
	configSpec := config.Spec

	if err := r.reconcileKalmController(configSpec); err != nil {
		r.Log.Info("reconcileKalmController fail", "error", err)
		return err
	}

	if err := r.reconcileDefaultTenantForBYOCMode(configSpec.BYOCModeConfig.Owner); err != nil {
		r.Log.Info("reconcileDefaultTenantForSaaSMode fail", "error", err)
		return err
	}

	if err := r.reconcileKalmDashboard(configSpec); err != nil {
		r.Log.Info("reconcileKalmDashboard fail", "error", err)
		return err
	}

	byocModeConfig := configSpec.BYOCModeConfig

	baseDNSDomain := byocModeConfig.BaseDNSDomain
	if baseDNSDomain != "" {
		if err := r.reconcileACMEServer(baseDNSDomain); err != nil {
			r.Log.Info("reconcileACMEServer fail", "error", err)
			return err
		}
	}

	baseAppDomain := byocModeConfig.BaseAppDomain
	if baseAppDomain != "" {
		applyForWildcardCert := baseDNSDomain != ""

		if err := r.reconcileHttpsCertForDomain(baseAppDomain, applyForWildcardCert); err != nil {
			r.Log.Info("reconcileHttpsCertForDomain fail", "error", err)
			return err
		}
	}

	if err := r.reconcileRootAccessTokenForBYOC(); err != nil {
		r.Log.Info("reconcileRootAccessTokenForBYOC fail", "error", err)
		return err
	}

	if config.Status.BYOCModeStatus != nil && config.Status.BYOCModeStatus.ClusterInfoHasSendToKalmSaaS {
		r.Log.Info("ClusterInfoHasSendToKalmSaaS is true, report skipped")
		return nil
	}

	// if installation is ready
	// - post cluster info to kalm-SaaS
	// - update status
	clusterInfo, ready := r.getClusterInfoIfIsReady(byocModeConfig)
	if !ready {
		r.Log.Info("BYOC cluster not ready yet, will wait...", "clusterInfo", clusterInfo)
		return nil
	}

	// call Kalm-SaaS API
	if ok, err := r.reportClusterInfoToKalmSaaS(clusterInfo, byocModeConfig.KalmSaaSDomain, byocModeConfig.ClusterName); err != nil {
		r.Log.Error(err, "reportClusterInfoToKalmSaaS failed")
		return err
	} else if !ok {
		r.Log.Info("fail to report BYOC cluster info to Kalm-SaaS, will retry later...")
		return nil
	} else {
		if config.Status.BYOCModeStatus == nil {
			config.Status.BYOCModeStatus = &installv1alpha1.BYOCModeStatus{}
		}

		config.Status.BYOCModeStatus.ClusterInfoHasSendToKalmSaaS = true

		return r.Status().Update(r.Ctx, config)
	}
}

type ClusterInfo struct {
	ClusterIP         string `json:"clusterIP,omitempty"`
	ACMEServerIP      string `json:"acmeServerIP,omitempty"`
	ACMEDomainForApps string `json:"acmeDomainForApps,omitempty"`
	RootAccessToken   string `json:"rootAccessToken,omitempty"`
}

func (r *KalmOperatorConfigReconciler) getClusterInfoIfIsReady(byocModeConfig *installv1alpha1.BYOCModeConfig) (ClusterInfo, bool) {

	clusterIP := r.getClusterIP()
	acmeServerIP := r.getACMEServerIP()
	domain, _ := r.getACMEDomainForApps(byocModeConfig.BaseAppDomain)
	token, _ := r.getRootAccessToken()

	isReady := clusterIP != "" && acmeServerIP != "" && domain != "" && token != ""

	return ClusterInfo{
		ClusterIP:         clusterIP,
		ACMEServerIP:      acmeServerIP,
		ACMEDomainForApps: domain,
		RootAccessToken:   token,
	}, isReady
}

func (r *KalmOperatorConfigReconciler) reportClusterInfoToKalmSaaS(clusterInfo ClusterInfo, kalmSaaSDomain string, clusterName string) (bool, error) {
	token, err := r.getTokenForKalmSaaS()
	if err != nil {
		return false, err
	}

	kalmSaaSAPI := fmt.Sprintf("https://%s/byoc/clusters/%s/clusterInfo?token=%s", kalmSaaSDomain, clusterName, token)
	payload, _ := json.Marshal(clusterInfo)

	r.Log.Info("reportClusterInfoToKalmSaaS", "api", kalmSaaSAPI, "payload", string(payload))

	resp, err := http.Post(kalmSaaSAPI, "application/json; charset=UTF-8", bytes.NewReader(payload))
	if err != nil {
		return false, err
	}

	if resp.StatusCode != 200 {
		r.Log.Info("reportClusterInfoToKalmSaaS failed", "resp", resp.Body, "status", resp.StatusCode)
		return false, nil
	}

	return true, nil
}

func (r *KalmOperatorConfigReconciler) getACMEDomainForApps(appsDomain string) (string, error) {
	certList := v1alpha1.HttpsCertList{}
	if err := r.List(r.Ctx, &certList); err != nil {
		return "", err
	}

	for _, cert := range certList.Items {
		for _, domain := range cert.Spec.Domains {
			if domain != appsDomain {
				continue
			}

			if cert.Status.WildcardCertDNSChallengeDomainMap == nil {
				continue
			}

			return cert.Status.WildcardCertDNSChallengeDomainMap[appsDomain], nil
		}
	}

	return "", nil
}

func (r *KalmOperatorConfigReconciler) getRootAccessToken() (string, error) {
	accessTokenList := v1alpha1.AccessTokenList{}

	//todo more strict label on this token
	filter := client.MatchingLabels(map[string]string{"tenant": "global"})

	if err := r.List(r.Ctx, &accessTokenList, filter); err != nil {
		return "", err
	}

	if len(accessTokenList.Items) <= 0 {
		return "", fmt.Errorf("expected rootAccessToken not exist")
	}

	token := accessTokenList.Items[0]
	return token.Spec.Token, nil
}

func (r *KalmOperatorConfigReconciler) getTokenForKalmSaaS() (string, error) {
	ns := "kalm-operator"
	secName := "kalm-saas-token"

	sec := v1.Secret{}
	if err := r.Get(r.Ctx, client.ObjectKey{Namespace: ns, Name: secName}, &sec); err != nil {
		return "", err
	}

	data := sec.Data["TOKEN"]
	return parseBase64EncodedString(data)
}

func parseBase64EncodedString(data []byte) (string, error) {
	oriTxt := make([]byte, len(data))
	l, err := base64.StdEncoding.Decode(oriTxt, data)
	if err != nil {
		return "", err
	}

	return string(oriTxt[:l]), nil
}
