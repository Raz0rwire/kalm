/*

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

type ProtectedEndpointType string

const (
	// Protect a single port of a component
	TypePort ProtectedEndpointType = "Port"

	// Protect all ports of a component
	TypeComponent ProtectedEndpointType = "Component"

	// Protect all ports that receive traffic from this route
	TypeHttpRoute ProtectedEndpointType = "HttpRoute"
)

// ProtectedEndpointSpec defines the desired state of ProtectedEndpoint
type ProtectedEndpointSpec struct {
	EndpointName string                `json:"name"`
	Type         ProtectedEndpointType `json:"type,omitempty"`

	Ports  []uint32 `json:"ports,omitempty"`
	Groups []string `json:"groups,omitempty"`
}

// ProtectedEndpointStatus defines the observed state of ProtectedEndpoint
type ProtectedEndpointStatus struct {
}

// +kubebuilder:object:root=true
// +kubebuilder:printcolumn:name="Type",type="string",JSONPath=".spec.type"

// ProtectedEndpoint is the Schema for the protectedendpoints API
type ProtectedEndpoint struct {
	metav1.TypeMeta   `json:",inline"`
	metav1.ObjectMeta `json:"metadata,omitempty"`

	Spec   ProtectedEndpointSpec   `json:"spec,omitempty"`
	Status ProtectedEndpointStatus `json:"status,omitempty"`
}

// +kubebuilder:object:root=true

// ProtectedEndpointList contains a list of ProtectedEndpoint
type ProtectedEndpointList struct {
	metav1.TypeMeta `json:",inline"`
	metav1.ListMeta `json:"metadata,omitempty"`
	Items           []ProtectedEndpoint `json:"items"`
}

func init() {
	SchemeBuilder.Register(&ProtectedEndpoint{}, &ProtectedEndpointList{})
}
