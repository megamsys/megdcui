package host

import (
  "fmt"

  "github.com/megamsys/megdc/handler"
)

var BRIDGE = []string{"CreateBridge"}

type CreateBridge struct{

	All              bool
	CreateBridge    bool
  Bridgename string
  PhyDev string
	Network string
	Netmask string
	Gateway string
	Dnsname1 string
	Dnsname2 string
	Host string
	Username string
	Password string
}





func (i *CreateBridge) Bridge(bridgename, phydev, network, netmask, gateway, dnsname1, dnsname2, host, username, password string) error {

fmt.Println("$$$$$$$$$$$$$$$$$$4")
fmt.Println(i)
a := CreateBridge{CreateBridge: true,  Bridgename: bridgename, PhyDev: phydev, Network: network, Netmask: netmask, Gateway: gateway, Dnsname1: dnsname1, Dnsname2: dnsname2, Host: host, Username: username, Password: password }
  c := handler.NewWrap(&a)
  fmt.Println(c)
	c.IfNoneAddPackages(BRIDGE)
	if h, err := handler.NewHandler(c); err != nil {
		return err
	} else if err := h.Run(); err != nil {
		return err
	}
	return nil

return nil
}
