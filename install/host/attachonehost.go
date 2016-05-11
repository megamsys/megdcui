package host

import (
  "github.com/megamsys/megdcui/install"
  "github.com/megamsys/megdc/handler"
)

var ATTACHHOST = []string{"AttachOneHost"}

type AttachOneHost struct {
	All              bool
  AttachOneHost  bool
	InfoDriver string
	HostName string
  Vm  string
  Networking string
	Username string
	Password string
	Host string
}



func (i *AttachOneHost) SetAttachOneHost(infodriver, vm, hostname, network, host,username,password string) error  {

a := AttachOneHost{All: false, AttachOneHost: true,  InfoDriver: infodriver, HostName: hostname, Vm: vm, Networking: network,  Host: host, Username: username, Password: password }
  c := handler.NewWrap(&a)
  err := install.Runner(ATTACHHOST, c)
  if err !=nil {
    return err
  }
return nil
}
