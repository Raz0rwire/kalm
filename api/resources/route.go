package resources

import (
	"github.com/kalmhq/kalm/controller/api/v1alpha1"
	metaV1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"sigs.k8s.io/controller-runtime/pkg/client"
)

type HttpRouteListChannel struct {
	List  chan []*v1alpha1.HttpRoute
	Error chan error
}

func (resourceManager *ResourceManager) GetHttpRouteListChannel(listOptions ...client.ListOption) *HttpRouteListChannel {
	channel := &HttpRouteListChannel{
		List:  make(chan []*v1alpha1.HttpRoute, 1),
		Error: make(chan error, 1),
	}

	go func() {

		var fetched v1alpha1.HttpRouteList
		err := resourceManager.List(&fetched, listOptions...)

		if err != nil {
			channel.List <- nil
			channel.Error <- err
			return
		}

		res := make([]*v1alpha1.HttpRoute, len(fetched.Items))

		for i, route := range fetched.Items {
			res[i] = &route
		}

		channel.List <- res
		channel.Error <- err
	}()

	return channel
}

type HttpRoute struct {
	*v1alpha1.HttpRouteSpec `json:",inline"`
	Name                    string `json:"name"`
	Namespace               string `json:"namespace"`
}

func (resourceManager *ResourceManager) GetHttpRoute(namespace, name string) (*HttpRoute, error) {
	var route v1alpha1.HttpRoute

	if err := resourceManager.Get(namespace, name, &route); err != nil {
		return nil, err
	}

	return BuildHttpRouteFromResource(&route), nil
}

func (resourceManager *ResourceManager) GetHttpRoutes(namespace string) ([]*HttpRoute, error) {
	var routes v1alpha1.HttpRouteList

	if err := resourceManager.List(&routes, client.InNamespace(namespace)); err != nil {
		return nil, err
	}

	res := make([]*HttpRoute, len(routes.Items))

	for i := range routes.Items {
		res[i] = BuildHttpRouteFromResource(&routes.Items[i])
	}

	return res, nil
}

func BuildHttpRouteFromResource(route *v1alpha1.HttpRoute) *HttpRoute {
	return &HttpRoute{
		HttpRouteSpec: &route.Spec,
		Name:          route.Name,
		Namespace:     route.Namespace,
	}
}

func (resourceManager *ResourceManager) CreateHttpRoute(routeSpec *HttpRoute) (*HttpRoute, error) {
	route := &v1alpha1.HttpRoute{
		ObjectMeta: metaV1.ObjectMeta{
			Name:      routeSpec.Name,
			Namespace: routeSpec.Namespace,
		},
		Spec: *routeSpec.HttpRouteSpec,
	}

	if err := resourceManager.Create(route); err != nil {
		return nil, err
	}

	return BuildHttpRouteFromResource(route), nil
}

func (resourceManager *ResourceManager) UpdateHttpRoute(routeSpec *HttpRoute) (*HttpRoute, error) {
	route := &v1alpha1.HttpRoute{}

	if err := resourceManager.Get(routeSpec.Namespace, routeSpec.Name, route); err != nil {
		return nil, err
	}

	route.Spec = *routeSpec.HttpRouteSpec

	if err := resourceManager.Update(route); err != nil {
		return nil, err
	}

	return BuildHttpRouteFromResource(route), nil
}

func (resourceManager *ResourceManager) DeleteHttpRoute(namespace, name string) error {
	return resourceManager.Delete(&v1alpha1.HttpRoute{ObjectMeta: metaV1.ObjectMeta{Name: name, Namespace: namespace}})
}
