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
//	"net/url"
//	"os"
	//"os/user"
//	"path/filepath"
	"regexp"
//	"runtime"
//	"strconv"
//	"strings"
//	"time"

	"gopkg.in/yaml.v2"
)


var cnameRegexp = regexp.MustCompile(`^(\*\.)?[a-zA-Z0-9][\w-.]+$`)

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


// Box represents a provision unit. Can be a machine, container or anything
// IP-addressable.
type Box struct {
  BaseUrl      string
	Id           string
	Key 				 string
  Provider     string
	Status       Status
}

func (b *Box) String() string {
	if d, err := yaml.Marshal(b); err != nil {
		return err.Error()
	} else {
		return string(d)
	}
}
