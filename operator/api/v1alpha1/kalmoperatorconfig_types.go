/*
Copyright 2020 Kalm Dev.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

package v1alpha1

import (
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

type NameValue struct {
	Name  string `json:"name"`
	Value string `json:"value"`
}

type DashboardConfig struct {
	Version  *string     `json:"version,omitempty"`
	Args     []string    `json:"args,omitempty"`
	Envs     []NameValue `json:"envs,omitempty"`
	Replicas *int32      `json:"replicas,omitempty"`
}

type ControllerConfig struct {
	Version *string `json:"version,omitempty"`
	// +optional
	UseLetsEncryptProductionAPI bool `json:"useLetsencryptProductionAPI"`
	// +optional
	ExternalDNSServerIP string `json:"externalDNSServerIP"`
}

// KalmOperatorConfigSpec defines the desired state of KalmOperatorConfig
type KalmOperatorConfigSpec struct {
	SkipIstioInstallation       bool `json:"skipIstioInstallation,omitempty"`
	SkipCertManagerInstallation bool `json:"skipCertManagerInstallation,omitempty"`
	// SkipKalmControllerInstallation bool `json:"skipKalmControllerInstallation,omitempty"`
	SkipKalmDashboardInstallation bool `json:"skipKalmDashboardInstallation,omitempty"`

	// deprecated, use Version instead
	KalmVersion string `json:"kalmVersion,omitempty"`
	Version     string `json:"version,omitempty"`

	// deprecated, diff mode has diff config now
	KalmType string `json:"kalmType,omitempty"`

	BYOCModeConfig *BYOCModeConfig `json:"byocModeConfig,omitempty"`
	// SaaSModeConfig  *SaaSModeConfig  `json:"saasModeConfig,omitempty"`
	LocalModeConfig *LocalModeConfig `json:"localModeConfig,omitempty"`

	PhysicalClusterID string `json:"physicalClusterId,omitempty"`

	// Dashboard Config
	Dashboard *DashboardConfig `json:"dashboard,omitempty"`
	// Controller Config
	Controller *ControllerConfig `json:"controller,omitempty"`
}

type BYOCModeConfig struct {
	ClusterName    string `json:"clusterName,omitempty"`
	KalmSaaSDomain string `json:"kalmSaaSDomain,omitempty"`
	Owner          string `json:"owner,omitempty"`

	// like: foobar.byoc.kalm.dev
	BaseDashboardDomain string `json:"baseDashboardDomain,omitempty"`
	// like: foobar.byoc-clusters.kalm-apps.com
	BaseAppDomain string `json:"baseAppDomain,omitempty"`
	// like: foobar.byoc-clusters.kalm-dns.com
	BaseDNSDomain string `json:"baseDNSDomain,omitempty"`

	OIDCIssuer *OIDCIssuerConfig `json:"oidcIssuer,omitempty"`
}

type SaaSModeConfig struct {
	// like: us-west1-1.kalm.dev
	BaseDashboardDomain string `json:"baseDashboardDomain,omitempty"`
	// like: us-west1-1.clusters.kalm-apps.com
	BaseAppDomain string `json:"baseAppDomain,omitempty"`
	// like: us-west1-1.clusters.kalm-dns.com
	BaseDNSDomain string `json:"baseDNSDomain,omitempty"`

	OIDCIssuer *OIDCIssuerConfig `json:"oidcIssuer,omitempty"`

	CloudflareConfig *CloudflareConfig `json:"cloudflareConfig,omitempty"`
}

type LocalModeConfig struct {
	CloudflareConfig *CloudflareConfig `json:"cloudflareConfig,omitempty"`
}

type OIDCIssuerConfig struct {
	// like: https://staging.kalm.dev/oidc
	IssuerURL    string `json:"issuerURL,omitempty"`
	ClientId     string `json:"clientId,omitempty"`
	ClientSecret string `json:"clientSecret,omitempty"`
}

type CloudflareConfig struct {
	APIToken             string            `json:"apiToken,omitempty"`
	DomainToZoneIDConfig map[string]string `json:"domainToZoneIDConfig,omitempty"`
}

// KalmOperatorConfigStatus defines the observed state of KalmOperatorConfig
type KalmOperatorConfigStatus struct {
	BYOCModeStatus *BYOCModeStatus `json:"byocModeStatus,omitempty"`
}

type BYOCModeStatus struct {
	ClusterInfoHasSendToKalmSaaS bool `json:"clusterInfoHasSendToKalmSaaS,omitempty"`
}

// +kubebuilder:object:root=true
// +kubebuilder:subresource:status

// KalmOperatorConfig is the Schema for the kalmoperatorconfigs API
type KalmOperatorConfig struct {
	metav1.TypeMeta   `json:",inline"`
	metav1.ObjectMeta `json:"metadata,omitempty"`

	Spec   KalmOperatorConfigSpec   `json:"spec,omitempty"`
	Status KalmOperatorConfigStatus `json:"status,omitempty"`
}

// +kubebuilder:object:root=true

// KalmOperatorConfigList contains a list of KalmOperatorConfig
type KalmOperatorConfigList struct {
	metav1.TypeMeta `json:",inline"`
	metav1.ListMeta `json:"metadata,omitempty"`
	Items           []KalmOperatorConfig `json:"items"`
}

func init() {
	SchemeBuilder.Register(&KalmOperatorConfig{}, &KalmOperatorConfigList{})
}
