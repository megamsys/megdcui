
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
package install

import (
 "fmt"
	//"gopkg.in/yaml.v2"
)

const (

)

var managers map[string]InstallHost

type Host interface {
}

// HostManager represents a manager of application Hosts.
type InstallHost interface {

  HostInfos(host,username,password string) error
  CreateBridge(bridgename, phydev, network, netmask, gateway, dnsname1, dnsname2,host,username,password string) error
  HostCheck(host,username,password string) error
  CreateNetwork(bridge, iptype, ip, size, dns1, dns2, network, gateway, host,username,password string) error
}


func Get(name string) (Host, error) {
	p, ok := managers[name]
	if !ok {
		return nil, fmt.Errorf("unknown Host server: %q", name)
	}
	return p, nil
}

// Manager returns the current configured manager, as defined in the
// configuration file.
func Manager(managerName string) InstallHost {
	if _, ok := managers[managerName]; !ok {
		managerName = "nop"
	}
	return managers[managerName]
}

// Register registers a new repository manager, that can be later configured
// and used.
func Register(name string, manager InstallHost) {
	if managers == nil {
		managers = make(map[string]InstallHost)
	}
	managers[name] = manager
}

type Status string

func (s Status) String() string {
	return string(s)
}
