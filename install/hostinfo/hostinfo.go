package hostinfo



import (

  "github.com/megamsys/megdc/handler"
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

	z :=HostInfo{ All: false, HostInfo: false, Host: "91.194.84.109", Username: "root", Password: "S0shS1tPHvz9O4"}

  f := handler.NewWrap(&z)
  f.IfNoneAddPackages(INSTALL_PACKAGES)
	if h, err := handler.NewHandler(f); err != nil {
		return err
	} else if err := h.Run(); err != nil {
		return err
	}

	return nil
}
