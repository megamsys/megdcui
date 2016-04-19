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
package migration

import (
 "fmt"
)

const (

)

var managers map[string]MigrationHost

type DataCenter interface {
}

// HostManager represents a manager of application Hosts.
type MigrationHost interface {
	MigratablePrepare(ip, id, key string) error
	MigrateHost(hostip,user,password string) error
}


func Get(name string) (DataCenter, error) {
	p, ok := managers[name]
	if !ok {
		return nil, fmt.Errorf("unknown Host server: %q", name)
	}
	return p, nil
}

// Manager returns the current configured manager, as defined in the
// configuration file.
func Manager(managerName string) MigrationHost {
	if _, ok := managers[managerName]; !ok {
		managerName = "nop"
	}
	return managers[managerName]
}

// Register registers a new repository manager, that can be later configured
// and used.
func Register(name string, manager MigrationHost) {
	if managers == nil {
		managers = make(map[string]MigrationHost)
	}
	managers[name] = manager
}

type Status string

func (s Status) String() string {
	return string(s)
}
