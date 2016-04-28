package host

import (
  "io"
   "os"
   "bytes"
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
  var outBuffer bytes.Buffer
  writer := io.MultiWriter(&outBuffer, os.Stdout)
  fmt.Printf("Before sent %#v:",outBuffer)

a := CreateBridge{All: false,CreateBridge: true,  Bridgename: bridgename, PhyDev: phydev, Network: network, Netmask: netmask, Gateway: gateway, Dnsname1: dnsname1, Dnsname2: dnsname2, Host: host, Username: username, Password: password }
  c := handler.NewWrap(&a)
	c.IfNoneAddPackages(BRIDGE)
	if h, err := handler.NewHandler(c); err != nil {
		return err
	} else if err := h.Run(writer); err != nil {
		return err
	}
  w, _ := os.Create("/home/dat2")
  n2, _ := w.Write(outBuffer.Bytes())
  //fmt.Print(writer.String())
  fmt.Printf("%#v",writer)
  fmt.Println(n2)

return nil
}
