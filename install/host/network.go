package host

import (
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

func (i *CreateBridge) CreateNetwork(bridge, iptype, ip, size, dns1, dns2, netmask, gateway, host,username,password string) error {

a := CreateNetwork{CreateNetwork: true,  Bridge: bridge, Iptype: iptype, Ip: ip, Size: size, Dns1: dns1, Dns2: dns2, Networkmask: netmask, Gateway: gateway, Host: host, Username: username, Password: password }
  c := handler.NewWrap(&a)
	c.IfNoneAddPackages(NETWORK)
	if h, err := handler.NewHandler(c); err != nil {
		return err
	} else if err := h.Run(); err != nil {
		return err
	}
	return nil

return nil
}
