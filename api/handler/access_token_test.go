package handler

import (
	"net/http"
	"testing"

	"github.com/kalmhq/kalm/api/resources"
	"github.com/kalmhq/kalm/controller/api/v1alpha1"
	"github.com/stretchr/testify/suite"
)

type AccessTokenTestSuite struct {
	WithControllerTestSuite
	namespace string
}

func TestAccessTokenTestSuite(t *testing.T) {
	suite.Run(t, new(AccessTokenTestSuite))
}

func (suite *AccessTokenTestSuite) SetupSuite() {
	suite.WithControllerTestSuite.SetupSuite()
	suite.namespace = "kalm-test"
	suite.ensureNamespaceExist(suite.namespace)
}

func (suite *AccessTokenTestSuite) TeardownSuite() {
	suite.ensureNamespaceDeleted(suite.namespace)
}

func (suite *AccessTokenTestSuite) TestGetEmptyList() {

	// list
	suite.DoTestRequest(&TestRequestContext{
		Roles: []string{
			GetClusterEditorRole(),
		},
		Method: http.MethodGet,
		Path:   "/v1alpha1/access_tokens",
		TestWithRoles: func(rec *ResponseRecorder) {
			var res []resources.AccessToken
			rec.BodyAsJSON(&res)
			suite.Equal(200, rec.Code)
		},
	})
}

func (suite *AccessTokenTestSuite) TestCreateAndDelete() {
	key := resources.AccessToken{
		AccessTokenSpec: &v1alpha1.AccessTokenSpec{
			Rules: []v1alpha1.AccessTokenRule{
				{
					Verb:      "view",
					Namespace: "*",
					Name:      "*",
					Kind:      "*",
				},
			},
			Creator: "test",
		},
	}

	// A namespace owner in the default tenant can't create access token
	suite.DoTestRequest(&TestRequestContext{
		Roles: []string{
			GetEditorRoleOfScope(defaultTenant, "ns1"),
		},
		Namespace: "ns1",
		Method:    http.MethodPost,
		Body:      key,
		Path:      "/v1alpha1/access_tokens",
		TestWithRoles: func(rec *ResponseRecorder) {
			var res resources.AccessToken
			rec.BodyAsJSON(&res)
			suite.Equal(401, rec.Code)
		},
	})

	// create
	suite.DoTestRequest(&TestRequestContext{
		Roles: []string{
			GetTenantOwnerRole(defaultTenant),
		},
		Method: http.MethodPost,
		Body:   key,
		Path:   "/v1alpha1/access_tokens",
		TestWithoutRoles: func(rec *ResponseRecorder) {
			suite.IsMissingRoleError(rec, resources.InsufficientPermissionsError.Error())
		},
		TestWithRoles: func(rec *ResponseRecorder) {
			var res resources.AccessToken
			rec.BodyAsJSON(&res)
			suite.Equal(201, rec.Code)
		},
	})

	// list in same tenant
	suite.DoTestRequest(&TestRequestContext{
		Roles: []string{
			GetTenantOwnerRole(defaultTenant),
		},
		Method: http.MethodGet,
		Path:   "/v1alpha1/access_tokens",
		TestWithRoles: func(rec *ResponseRecorder) {
			var resList []resources.AccessToken
			rec.BodyAsJSON(&resList)
			suite.Equal(200, rec.Code)
			suite.Equal(1, len(resList))

			// set name for delete
			key.Name = resList[0].Name
		},
	})

	// list in another tenant, should get 0
	suite.DoTestRequest(&TestRequestContext{
		Roles: []string{
			GetTenantOwnerRole("anotherTenant"),
		},
		Tenant: "anotherTenant",
		Method: http.MethodGet,
		Path:   "/v1alpha1/access_tokens",
		TestWithRoles: func(rec *ResponseRecorder) {
			var resList []resources.AccessToken
			rec.BodyAsJSON(&resList)
			suite.Equal(200, rec.Code)
			suite.Equal(0, len(resList))
		},
	})

	// Delete
	suite.DoTestRequest(&TestRequestContext{
		Roles: []string{
			GetTenantOwnerRole(defaultTenant),
		},
		Method: http.MethodDelete,
		Path:   "/v1alpha1/access_tokens",
		Body:   key,
		TestWithoutRoles: func(rec *ResponseRecorder) {
			suite.IsMissingRoleError(rec, resources.InsufficientPermissionsError.Error())
		},
		TestWithRoles: func(rec *ResponseRecorder) {
			suite.Equal(200, rec.Code)
		},
	})

	// list again
	suite.DoTestRequest(&TestRequestContext{
		Roles: []string{
			GetTenantOwnerRole(defaultTenant),
		},
		Method: http.MethodGet,
		Path:   "/v1alpha1/access_tokens",
		TestWithRoles: func(rec *ResponseRecorder) {
			var resList []resources.AccessToken
			rec.BodyAsJSON(&resList)

			suite.Equal(200, rec.Code)
			suite.Equal(0, len(resList))
		},
	})
}
