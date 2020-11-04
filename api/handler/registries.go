package handler

import (
	"fmt"

	"github.com/kalmhq/kalm/api/errors"
	"github.com/kalmhq/kalm/api/resources"
	"github.com/kalmhq/kalm/controller/api/v1alpha1"
	"github.com/labstack/echo/v4"
	"sigs.k8s.io/controller-runtime/pkg/client"
)

func (h *ApiHandler) InstallRegistriesHandlers(e *echo.Group) {
	e.GET("/registries", h.handleListRegistries)
	e.GET("/registries/:name", h.handleGetRegistry)
	e.PUT("/registries/:name", h.handleUpdateRegistry)
	e.POST("/registries", h.handleCreateRegistry)
	e.DELETE("/registries/:name", h.handleDeleteRegistry)
}

func (h *ApiHandler) getRegistryFromContext(c echo.Context) (*resources.DockerRegistry, error) {
	currentUser := getCurrentUser(c)

	list, err := h.resourceManager.GetDockerRegistries(client.MatchingLabels{
		v1alpha1.TenantNameLabelKey: currentUser.Tenant,
	}, client.MatchingField("metadata.name", c.Param("name")), client.Limit(1))

	if err != nil {
		return nil, err
	}

	if len(list) < 1 {
		return nil, errors.NewNotFound("")
	}

	return list[0], nil
}

// handlers

func (h *ApiHandler) handleListRegistries(c echo.Context) error {
	currentUser := getCurrentUser(c)
	h.MustCanView(currentUser, currentUser.Tenant+"/*", "registries/*")

	list, err := h.resourceManager.GetDockerRegistries(client.MatchingLabels{
		v1alpha1.TenantNameLabelKey: getCurrentUser(c).Tenant,
	})

	if err != nil {
		return err
	}

	return c.JSON(200, list)
}

func (h *ApiHandler) handleGetRegistry(c echo.Context) error {
	currentUser := getCurrentUser(c)
	h.MustCanView(currentUser, currentUser.Tenant+"/*", "registries/"+c.Param("name"))

	registry, err := h.getRegistryFromContext(c)

	if err != nil {
		return err
	}

	return c.JSON(200, registry)
}

func (h *ApiHandler) handleCreateRegistry(c echo.Context) (err error) {
	currentUser := getCurrentUser(c)
	h.MustCanEdit(currentUser, currentUser.Tenant+"/*", "registries/*")

	var registry *resources.DockerRegistry

	if registry, err = bindDockerRegistryFromRequestBody(c); err != nil {
		return err
	}

	registry.Tenant = currentUser.Tenant

	if registry, err = h.resourceManager.CreateDockerRegistry(registry); err != nil {
		return err
	}

	return c.JSON(201, registry)
}

func (h *ApiHandler) handleUpdateRegistry(c echo.Context) (err error) {
	currentUser := getCurrentUser(c)
	h.MustCanEdit(currentUser, currentUser.Tenant+"/*", "registries/"+c.Param("name"))

	var registry *resources.DockerRegistry
	if registry, err = bindDockerRegistryFromRequestBody(c); err != nil {
		return err
	}

	if registry.Name != c.Param("name") {
		return fmt.Errorf("Name in body and url are mismatched")
	}

	registry.Tenant = currentUser.Tenant

	if registry, err = h.resourceManager.UpdateDockerRegistry(registry); err != nil {
		return err
	}

	return c.JSON(200, registry)
}

func (h *ApiHandler) handleDeleteRegistry(c echo.Context) error {
	currentUser := getCurrentUser(c)
	h.MustCanEdit(currentUser, currentUser.Tenant+"/*", "registries/"+c.Param("name"))

	registry, err := h.getRegistryFromContext(c)

	if err != nil {
		return err
	}

	if registry.Tenant != currentUser.Tenant {
		return resources.NotTenantOwnerError
	}

	if err := h.resourceManager.DeleteDockerRegistry(c.Param("name")); err != nil {
		return err
	}

	return c.NoContent(200)
}

func bindDockerRegistryFromRequestBody(c echo.Context) (*resources.DockerRegistry, error) {
	var registry resources.DockerRegistry

	if err := c.Bind(&registry); err != nil {
		return nil, err
	}

	return &registry, nil
}
