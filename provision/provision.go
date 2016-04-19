/*
** Copyright [2013-2016] [Megam Systems]
**
** Licensed under the Apache License, Version 2.0 (the "License");
** you may not use this file except in compliance with the License.
** You may obtain a copy of the License at
**
** http://www.apache.org/licenses/LICENSE-2.0
**
** Unless required by applicable law or agreed to in writing, software
** distributed under the License is distributed on an "AS IS" BASIS,
** WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
** See the License for the specific language governing permissions and
** limitations under the License.
 */
package provision

import (
	"errors"
	"fmt"
//	"io"

//	"github.com/megamsys/vertice/carton/bind"
)

const (
	PROVIDER_ONE    = "solus"
)

var (
	ErrInvalidStatus  = errors.New("invalid status")
	ErrEmptyCarton    = errors.New("no boxs for this carton")
	ErrBoxNotFound    = errors.New("box not found")
	ErrNoOutputsFound = errors.New("no outputs found in the box. Did you set it ? ")
	ErrNotImplemented = errors.New("I'am on diet.")
)

// Status represents the status of a unit in vertice
type Status string

func (s Status) String() string {
	return string(s)
}

const (
	// StatusLaunching is the initial status of a box
	// Status for Solusvm Master satisfies cridentcials for migrate.
	StatusSolusNode = Status("NodeOK")
	// Status for Solusvm Master satisfies cridentcials for API.
	StatusSolusMaster = Status("SolusMasterOK")

	StatusError = Status("error")
)

var ProvisionerMap map[string]Provisioner = make(map[string]Provisioner)
// GitDeployer is a provisioner that can deploy the box from a Git
// repository.
type GitDeployer interface {
	GitDeploy(*Box) (string, error)
}

// StateChanger changes the state of a deployed box
// A deployed box is termed as a machine or a container
type StateChanger interface {
	SetState(*Box, Status) error
}

// Provisioner is the basic interface of this package.
//
// Any vertice provisioner must implement this interface in order to provision
// vertice cartons.
type Provisioner interface {
	Start(*Box, string) error
}

type MessageProvisioner interface {
	StartupMessage() (string, error)
}

// InitializableProvisioner is a provisioner that provides an initialization
// method that should be called when the carton is started,
//additionally provide a map of configuration info.
type InitializableProvisioner interface {
	Initialize(m map[string]string, b map[string]string) error
}

var provisioners = make(map[string]Provisioner)

// Register registers a new provisioner in the Provisioner registry.
func Register(name string, p Provisioner) {
	provisioners[name] = p
}

// Get gets the named provisioner from the registry.
func Get(name string) (Provisioner, error) {
	p, ok := provisioners[name]
	if !ok {
		return nil, fmt.Errorf("unknown provisioner: %q", name)
	}
	return p, nil
}

// Registry returns the list of registered provisioners.
func Registry() []Provisioner {
	registry := make([]Provisioner, 0, len(provisioners))
	for _, p := range provisioners {
		registry = append(registry, p)
	}
	return registry
}

// Error represents a provisioning error. It encapsulates further errors.
type Error struct {
	Reason string
	Err    error
}

// Error is the string representation of a provisioning error.
func (e *Error) Error() string {
	var err string
	if e.Err != nil {
		err = e.Err.Error() + ": " + e.Reason
	} else {
		err = e.Reason
	}
	return err
}
