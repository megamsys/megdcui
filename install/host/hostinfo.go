package host

import (
  "github.com/megamsys/megdc/handler"
  "github.com/megamsys/megdcui/install"
  )


var INSTALL_PACKAGES = []string{"HostInfo"}

type HostInfo struct {

	All              bool
	HostInfo    bool
	Host string
	Username string
	Password string
}

func (i *HostInfo) GetHostInfo(host, username, password string) error {
	z :=HostInfo{ All: false, HostInfo: false, Host: host, Username: username, Password: password}
  f := handler.NewWrap(&z)
  err := install.Runner(INSTALL_PACKAGES, f)
  if err !=nil {
    return err
  }
return nil
}
