package host

import (
  "github.com/megamsys/megdcui/install"
  "github.com/megamsys/megdc/handler"
  )


var OneHost = []string{"OneHostInstall"}

type Onehostinstall struct {
	Host string
	Username string
	Password string
}

func (i *Onehostinstall) InstallOneHost(host, username, password string) error {

	z :=Onehostinstall{ Host: host, Username: username, Password: password}
  f := handler.NewWrap(&z)
  err := install.Runner(OneHost, f)
  if err !=nil {
    return err
  }
return nil
}
