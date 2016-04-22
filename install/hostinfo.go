package install



import (
  //"github.com/megamsys/megdc/packages/megam"
  "fmt"
//  "launchpad.net/gnuflag"
)

const (
	HOST     = "Host"
	USERNAME = "Username"
	PASSWORD = "Password"
	PLATFORM = "platform"
)

//var INSTALL_PACKAGES = []string{"HostInfo"}
/*
type HostInfo struct{
  	Host string
  	Username string
  	Password string
}
*/

var INSTALL_PACKAGES = []string{"NilavuInstall",
	"GatewayInstall",
	"MegamdInstall"}

type VerticeInstall struct {
//Fs               *gnuflag.FlagSet
	All              bool
	NilavuInstall    bool
	GatewayInstall   bool
	MegamdInstall    bool
	SnowflakeInstall bool
	Host            string
	Username         string
	Password          string
}

func (i *VerticeInstall) GetHostInfo(host string, username string, password string) error {
  //a := megam.VerticeInstall{All: false, NilavuInstall: false, MegamdInstall: false, GatewayInstall: false, SnowflakeInstall: false, Host: host, Username: username, Password: password}
  //fmt.Println("*****************************")
  ///fmt.Println(a)
   //a.Info()
  //i.Fs =a.Flags()
  //fmt.Println(i.Fs)
	z := VerticeInstall{All: false, NilavuInstall: false, MegamdInstall: false, GatewayInstall: false, SnowflakeInstall: false, Host: host, Username: username, Password: password}
fmt.Println(z)

c := NewWrap(&z)
  c.IfNoneAddPackages(INSTALL_PACKAGES)
	if h, err := NewHandler(c); err != nil {
		return err
	} else if err := h.Run(); err != nil {
		return err
	}
	return nil

return nil
}
