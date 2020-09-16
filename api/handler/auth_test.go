package handler

import (
	"github.com/stretchr/testify/suite"
	"net/http"
	"testing"
)

type (
	Res struct {
		Authorized bool `json:"authorized"`
	}

	AuthTestSuite struct {
		WithControllerTestSuite
	}
)

func (suite *AuthTestSuite) TestLoginStatusWithToken() {
	rec := BaseRequest(suite.apiServer, http.MethodGet, "/login/status", nil, nil)
	var res Res
	rec.BodyAsJSON(&res)
	suite.Equal(false, res.Authorized)
}

func (suite *AuthTestSuite) TestLoginStatusWithoutToken() {
	rec := suite.NewRequestWithIdentity(http.MethodGet, "/login/status", nil, "foo@bar")
	var res Res
	rec.BodyAsJSON(&res)
	suite.Equal(true, res.Authorized)
}

func TestAuthTestSuite(t *testing.T) {
	suite.Run(t, new(AuthTestSuite))
}
