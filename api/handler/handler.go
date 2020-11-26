package handler

import (
	"github.com/kalmhq/kalm/api/client"
	"github.com/kalmhq/kalm/api/log"
	"github.com/kalmhq/kalm/api/resources"
	"github.com/kalmhq/kalm/api/ws"
	"github.com/labstack/echo/v4"
	"go.uber.org/zap"
)

type ApiHandler struct {
	resourceManager *resources.ResourceManager
	clientManager   client.ClientManager
	logger          *zap.Logger
	IsLocalMode     bool
}

func (h *ApiHandler) InstallWebhookRoutes(e *echo.Echo) {
	e.GET("/ping", handlePing)
	e.POST("/webhook/components", h.handleDeployWebhookCall)
}

func (h *ApiHandler) InstallMainRoutes(e *echo.Echo) {
	// recover panic from permission check
	e.Use(PermissionPanicRecoverMiddleware)

	e.GET("/ping", handlePing)
	e.GET("/policies", h.handlePolicies, h.GetUserMiddleware, h.RequireUserMiddleware)

	// watch
	wsHandler := ws.NewWsHandler(h.clientManager, h.IsLocalMode)
	e.GET("/ws", wsHandler.Serve)

	// login
	e.POST("/login/token", h.handleValidateToken)
	e.GET("/login/status", h.handleLoginStatus)

	// original resources routes
	gV1 := e.Group("/v1", h.GetUserMiddleware, h.RequireUserMiddleware)
	gV1.GET("/persistentvolumes", h.handleGetPVs)

	gv1Alpha1 := e.Group("/v1alpha1")
	gv1Alpha1.GET("/logs", h.logWebsocketHandler)
	gv1Alpha1.GET("/exec", h.execWebsocketHandler)

	var gv1Alpha1WithAuth *echo.Group
	if h.IsLocalMode {
		gv1Alpha1WithAuth = gv1Alpha1.Group("", h.GetUserMiddleware, h.RequireUserMiddleware, h.SetTenantForLocalModeIfMissing)
	} else {
		gv1Alpha1WithAuth = gv1Alpha1.Group("", h.GetUserMiddleware, h.RequireUserMiddleware)
	}

	// initialize the cluster
	gv1Alpha1WithAuth.POST("/initialize", h.handleInitializeCluster)
	gv1Alpha1WithAuth.POST("/reset", h.handleResetCluster)

	gv1Alpha1WithAuth.GET("/cluster", h.handleClusterInfo)

	gv1Alpha1WithAuth.GET("/loadbalancers", h.handleLoadBalancers)
	gv1Alpha1WithAuth.GET("/services", h.handleListClusterServices)
	gv1Alpha1WithAuth.GET("/componentplugins", h.handleListComponentPlugins)

	h.InstallApplicationsHandlers(gv1Alpha1WithAuth)
	h.InstallComponentsHandlers(gv1Alpha1WithAuth)
	h.InstallRegistriesHandlers(gv1Alpha1WithAuth)

	gv1Alpha1WithAuth.DELETE("/pods/:namespace/:name", h.handleDeletePod)

	gv1Alpha1WithAuth.GET("/rolebindings", h.handleListRoleBindings)
	gv1Alpha1WithAuth.POST("/rolebindings", h.handleCreateRoleBinding)
	gv1Alpha1WithAuth.PUT("/rolebindings", h.handleUpdateRoleBinding)
	gv1Alpha1WithAuth.DELETE("/rolebindings/:namespace/:name", h.handleDeleteRoleBinding)

	gv1Alpha1WithAuth.GET("/serviceaccounts/:name", h.handleGetServiceAccount)

	gv1Alpha1WithAuth.GET("/nodes", h.handleListNodes)
	gv1Alpha1WithAuth.POST("/nodes/:name/cordon", h.handleCordonNode)
	gv1Alpha1WithAuth.POST("/nodes/:name/uncordon", h.handleUncordonNode)

	h.InstallHttpRouteHandlers(gv1Alpha1WithAuth)
	h.InstallHttpCertIssuerHandlers(gv1Alpha1WithAuth)
	h.InstallHttpsCertsHandlers(gv1Alpha1WithAuth)

	gv1Alpha1WithAuth.GET("/storageclasses", h.handleListStorageClasses)

	gv1Alpha1WithAuth.GET("/volumes", h.handleListVolumes)
	gv1Alpha1WithAuth.DELETE("/volumes/:namespace/:name", h.handleDeletePVC)

	// deprecated
	gv1Alpha1WithAuth.GET("/volumes/available/simple-workload", h.handleAvailableVolsForSimpleWorkload)
	gv1Alpha1WithAuth.GET("/volumes/available/simple-workload/:namespace", h.handleAvailableVolsForSimpleWorkload)
	gv1Alpha1WithAuth.GET("/volumes/available/sts/:namespace", h.handleAvailableVolsForSts)

	h.InstallDeployAccessTokenHandlers(gv1Alpha1WithAuth)

	// general access token handler
	h.InstallAccessTokensHandlers(gv1Alpha1WithAuth)

	h.InstallSSOHandlers(gv1Alpha1WithAuth)
	h.InstallProtectedEndpointHandlers(gv1Alpha1WithAuth)
	h.InstallACMEServerHandlers(gv1Alpha1WithAuth)
	h.InstallTenantHandlers(gv1Alpha1WithAuth)

	gv1Alpha1WithAuth.GET("/settings", h.handleListSettings)
}

func NewApiHandler(clientManager client.ClientManager, isLocalMode bool) *ApiHandler {
	return &ApiHandler{
		clientManager:   clientManager,
		logger:          log.DefaultLogger(),
		resourceManager: resources.NewResourceManager(clientManager.GetDefaultClusterConfig(), log.DefaultLogger()),
		IsLocalMode:     isLocalMode,
	}
}
