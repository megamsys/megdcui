package host

import (

  "github.com/megamsys/megdc/handler"
  )


var INSTALL_PACKAGE= []string{"HostCheck"}

type HostCheck struct {
	All              bool
	HostCheck    bool
	Host string
	Username string
	Password string
}

func (i *HostCheck) GetHostCheck(host, username, password string) error {

	z :=HostCheck{ All: false, HostCheck: false, Host: host, Username: username, Password: password}

  f := handler.NewWrap(&z)
  f.IfNoneAddPackages(INSTALL_PACKAGE)
	if h, err := handler.NewHandler(f); err != nil {
		return err
	} else if err := h.Run(); err != nil {
		return err
	}

	return nil
}
