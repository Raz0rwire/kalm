package handler

import (
	"html/template"
	"sort"
	"strings"

	"github.com/kalmhq/kalm/api/errors"
	"github.com/kalmhq/kalm/api/resources"
	"github.com/kalmhq/kalm/controller/api/v1alpha1"
	"github.com/labstack/echo/v4"
	"k8s.io/apimachinery/pkg/api/resource"
	metaV1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/util/rand"
)

type Policies []string

func (a Policies) Len() int { return len(a) }

// The casbin policy roles always begin with "p, " or "g, " (len of 3)
// Sort all policies with actual subject names.
func (a Policies) Less(i, j int) bool { return a[i][3:] < a[j][3:] }
func (a Policies) Swap(i, j int)      { a[i], a[j] = a[j], a[i] }

func (h *ApiHandler) InstallAdminRoutes(e *echo.Echo) {
	g := e.Group("/admin")
	g.GET("/routes", handleApiRoutes)
}

func (h *ApiHandler) InstallAdminDebugRoutes(e *echo.Echo) {
	// debug routes, should not open when deploying on a production server
	g := e.Group("/admin/debug")
	g.POST("/tenant", h.handleCreateTemporaryTenant, h.GetUserMiddleware, h.RequireUserMiddleware)
	g.POST("/admin", h.handleCreateTemporaryAdmin, h.GetUserMiddleware, h.RequireUserMiddleware)
	g.POST("/clear", h.handleDebugCleanTenantAndAccessTokens, h.GetUserMiddleware, h.RequireUserMiddleware)
}

func (h *ApiHandler) handlePolicies(c echo.Context) error {
	if !h.clientManager.CanEditCluster(getCurrentUser(c)) {
		return resources.InsufficientPermissionsError
	}

	policies := h.clientManager.GetRBACEnforcer().GetPolicy()
	groupingPolicies := h.clientManager.GetRBACEnforcer().GetGroupingPolicy()

	var list []string

	for _, ps := range policies {
		list = append(list, "p, "+strings.Join(ps, ", "))
	}

	for _, item := range groupingPolicies {
		list = append(list, "g, "+strings.Join(item, ", "))
	}

	sort.Sort(Policies(list))

	return c.String(200, strings.Join(list, "\n"))
}

func handleApiRoutes(c echo.Context) error {
	return c.JSON(200, c.Echo().Routes())
}

func (h *ApiHandler) handleDebugCleanTenantAndAccessTokens(c echo.Context) error {
	var tenants v1alpha1.TenantList
	_ = h.resourceManager.List(&tenants)

	var tokens v1alpha1.AccessTokenList
	_ = h.resourceManager.List(&tokens)

	for i := range tokens.Items {
		_ = h.resourceManager.Delete(&tokens.Items[i])
	}

	for i := range tenants.Items {
		_ = h.resourceManager.Delete(&tenants.Items[i])
	}

	return nil
}

func (h *ApiHandler) handleCreateTemporaryAdmin(c echo.Context) error {
	tenantName := "global"

	ownerToken := rand.String(128)
	ownerTokenName := v1alpha1.GetAccessTokenNameFromToken(ownerToken)
	ownerAccessToken := &v1alpha1.AccessToken{
		ObjectMeta: metaV1.ObjectMeta{
			Name: ownerTokenName,
			Labels: map[string]string{
				v1alpha1.TenantNameLabelKey: tenantName,
			},
		},
		Spec: v1alpha1.AccessTokenSpec{
			Token: ownerToken,
			Rules: []v1alpha1.AccessTokenRule{
				{
					Verb:      "view",
					Namespace: "*",
					Kind:      "*",
					Name:      "*",
				},
				{
					Verb:      "edit",
					Namespace: "*",
					Kind:      "*",
					Name:      "*",
				},
				{
					Verb:      "manage",
					Namespace: "*",
					Kind:      "*",
					Name:      "*",
				},
			},
			Creator:   getCurrentUser(c).Name,
			ExpiredAt: nil,
		},
	}

	viewerToken := rand.String(128)
	viewerTokenName := v1alpha1.GetAccessTokenNameFromToken(viewerToken)
	viewerAccessToken := &v1alpha1.AccessToken{
		ObjectMeta: metaV1.ObjectMeta{
			Name: viewerTokenName,
			Labels: map[string]string{
				v1alpha1.TenantNameLabelKey: tenantName,
			},
		},
		Spec: v1alpha1.AccessTokenSpec{
			Token: viewerToken,
			Rules: []v1alpha1.AccessTokenRule{
				{
					Verb:      "view",
					Namespace: "*",
					Kind:      "*",
					Name:      "*",
				},
			},
			Creator:   getCurrentUser(c).Name,
			ExpiredAt: nil,
		},
	}

	editorToken := rand.String(128)
	editorTokenName := v1alpha1.GetAccessTokenNameFromToken(editorToken)
	editorAccessToken := &v1alpha1.AccessToken{
		ObjectMeta: metaV1.ObjectMeta{
			Name: editorTokenName,
			Labels: map[string]string{
				v1alpha1.TenantNameLabelKey: tenantName,
			},
		},
		Spec: v1alpha1.AccessTokenSpec{
			Token: editorToken,
			Rules: []v1alpha1.AccessTokenRule{
				{
					Verb:      "view",
					Namespace: "*",
					Kind:      "*",
					Name:      "*",
				},
				{
					Verb:      "edit",
					Namespace: "*",
					Kind:      "*",
					Name:      "*",
				},
			},
			Creator:   getCurrentUser(c).Name,
			ExpiredAt: nil,
		},
	}

	var tenant v1alpha1.Tenant
	if err := h.resourceManager.Get("", "tenant", &tenant); err != nil {
		tenant = v1alpha1.Tenant{
			ObjectMeta: metaV1.ObjectMeta{
				Name: tenantName,
			},
			Spec: v1alpha1.TenantSpec{
				TenantDisplayName: "test-tenant-global",
				ResourceQuota: map[v1alpha1.ResourceName]resource.Quantity{
					v1alpha1.ResourceAccessTokensCount: resource.MustParse("100"),
					v1alpha1.ResourceApplicationsCount: resource.MustParse("100"),
					v1alpha1.ResourceServicesCount:     resource.MustParse("100"),
					v1alpha1.ResourceComponentsCount:   resource.MustParse("100"),
					v1alpha1.ResourceCPU:               resource.MustParse("100"),
					v1alpha1.ResourceMemory:            resource.MustParse("100Gi"),
				},
				Owners: []string{ownerTokenName},
			},
		}

		if err := h.resourceManager.Create(&tenant); err != nil {
			if !errors.IsAlreadyExists(err) {
				return err
			}
		}
	}

	if err := h.resourceManager.Create(ownerAccessToken); err != nil {
		return err
	}

	if err := h.resourceManager.Create(viewerAccessToken); err != nil {
		return err
	}
	if err := h.resourceManager.Create(editorAccessToken); err != nil {
		return err
	}

	t := template.Must(template.New("policy").Parse(`
Cluster Owner Token: {{ .ownerToken }}
Cluster Viewer Token: {{ .viewerToken }}
Cluster Editor Token: {{ .editorToken }}
`))

	strBuffer := &strings.Builder{}
	_ = t.Execute(strBuffer, map[string]string{"ownerToken": ownerToken, "viewerToken": viewerToken, "editorToken": editorToken})

	return c.String(200, strBuffer.String())
}

func (h *ApiHandler) handleCreateTemporaryTenant(c echo.Context) error {
	token := rand.String(128)
	accessTokenName := v1alpha1.GetAccessTokenNameFromToken(token)
	tenantName := "tenant-" + rand.String(8)

	accessToken := &v1alpha1.AccessToken{
		ObjectMeta: metaV1.ObjectMeta{
			Name: accessTokenName,
			Labels: map[string]string{
				v1alpha1.TenantNameLabelKey: tenantName,
			},
		},
		Spec: v1alpha1.AccessTokenSpec{
			Token: token,
			Rules: []v1alpha1.AccessTokenRule{
				{
					Verb:      "view",
					Namespace: "*",
					Kind:      "*",
					Name:      "*",
				},
				{
					Verb:      "edit",
					Namespace: "*",
					Kind:      "*",
					Name:      "*",
				},
				{
					Verb:      "manage",
					Namespace: "*",
					Kind:      "*",
					Name:      "*",
				},
			},
			Creator:   getCurrentUser(c).Name,
			ExpiredAt: nil,
		},
	}

	tenant := &v1alpha1.Tenant{
		ObjectMeta: metaV1.ObjectMeta{
			Name: tenantName,
		},
		Spec: v1alpha1.TenantSpec{
			TenantDisplayName: tenantName,
			ResourceQuota: map[v1alpha1.ResourceName]resource.Quantity{
				v1alpha1.ResourceAccessTokensCount: resource.MustParse("100"),
				v1alpha1.ResourceRoleBindingCount:  resource.MustParse("100"),
				v1alpha1.ResourceApplicationsCount: resource.MustParse("100"),
				v1alpha1.ResourceServicesCount:     resource.MustParse("100"),
				v1alpha1.ResourceComponentsCount:   resource.MustParse("100"),
				v1alpha1.ResourceCPU:               resource.MustParse("100"),
				v1alpha1.ResourceMemory:            resource.MustParse("100Gi"),
			},
			Owners: []string{accessTokenName},
		},
	}

	if err := h.resourceManager.Create(tenant); err != nil {
		if !errors.IsAlreadyExists(err) {
			return err
		}
	}

	if err := h.resourceManager.Create(accessToken); err != nil {
		return err
	}

	t := template.Must(template.New("policy").Parse(`New temporary tenant created.

Name: {{ .tenantName }}
OwnerToken {{ .token }}
`))

	strBuffer := &strings.Builder{}
	_ = t.Execute(strBuffer, map[string]string{"tenantName": tenantName, "token": token})

	return c.String(200, strBuffer.String())
}
