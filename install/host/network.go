package host

import (
  "io"
   "os"
   "bytes"
   "fmt"
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
  var outBuffer bytes.Buffer
  writer := io.MultiWriter(&outBuffer, os.Stdout)
  fmt.Printf("Before sent %#v:",outBuffer)

a := CreateNetworkOpennebula{All: false,CreateNetworkOpennebula: true,  Bridge: bridgename, Iptype: iptype, Ip: ip, Size: size,  Dns1: dnsname1, Dns2: dnsname2,Networkmask: netmask, Gatewayip: gateway, Host: host, Username: username, Password: password }
  c := handler.NewWrap(&a)
	c.IfNoneAddPackages(NETWORK)
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
