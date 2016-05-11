package host

import (
  "github.com/megamsys/megdcui/install"
  "github.com/megamsys/megdc/handler"
)

var NETWORK = []string{"CreateNetworkOpennebula"}

type CreateNetworkOpennebula struct {
	All              bool
CreateNetworkOpennebula   bool
	Bridge string
  Iptype  string
	Ip string
	Size string
	Dns1 string
	Dns2 string
  Gatewayip   string
  Networkmask string
	Username string
	Password string
	Host string
}



func (i *CreateNetworkOpennebula) CreateNetwork(bridgename, iptype, ip, size, dnsname1, dnsname2, netmask, gateway ,host,username,password string) error{

a := CreateNetworkOpennebula{All: false,CreateNetworkOpennebula: true,  Bridge: bridgename, Iptype: iptype, Ip: ip, Size: size,  Dns1: dnsname1, Dns2: dnsname2,Networkmask: netmask, Gatewayip: gateway, Host: host, Username: username, Password: password }
  c := handler.NewWrap(&a)
  err := install.Runner(NETWORK, c)
  if err !=nil {
    return err
  }
return nil
}
