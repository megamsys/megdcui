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
 "github.com/megamsys/megdcui/automation"
	"gopkg.in/yaml.v2"
)

const (

)

var managers map[string]MigrationHost

type DataCenter interface {
}

// HostManager represents a manager of application Hosts.
type MigrationHost interface {
	MigratablePrepare(*automation.HostInfo) error
	MigrateHost(*automation.HostInfo) (*automation.Result, error)
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

type VirtualServer struct {
	Vserverid   	*string `json:"vserverid"`
	Ctid_xid    	*string `json:"ctid-xid"`
	Clientid      *string `json:"clientid"`
	Ipaddress     *string `json:"ipaddress"`
	Hostname      *string `json:"hostname"`
	Template      *string `json:"template"`
	Hdd    				*string `json:"hdd"`
	Memory     		*string `json:"memory"`
	Swap_burst 		*string `json:"swap-burst"`
	Type    			*string `json:"type"`
	Mac      			*string `json:"mac"`
}

type VServers struct {
	Status     *string `json:"status"`
	Statusmsg  *string `json:"statusmsg"`
	VirtualServers *[]VirtualServer `json:"virtualservers"`
	Org_id     string
}

type SolusCredential struct {
	SolusMaster string
}

type AuthKeys struct {
  BaseUrl      string
	Id           string
	Key 				 string
  Provider     string
	Status       Status
}

func (b *VirtualServer) String() string {
	if d, err := yaml.Marshal(b); err != nil {
		return err.Error()
	} else {
		return string(d)
	}
}
