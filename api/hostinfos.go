package api

import (
	"fmt"
	"net/http"
		log "github.com/Sirupsen/logrus"
		"github.com/megamsys/megdcui/install"
		_ "github.com/megamsys/megdcui/install/machine"
)
const(
	defaultHost = "host"
)
func hostinfos(w http.ResponseWriter, r *http.Request) error {
	fmt.Println("%%%%%%%%%%%%%%%%%%%%%%%%%%%%")
	var register install.Host
host := "103.56.92.18"
username := "megam"
password := "megam"
a, err := install.Get(defaultHost)

if err != nil {
	log.Errorf("fatal error, couldn't locate the Server %s", defaultHost)
	return err
}
register = a

if installHost, ok := register.(install.InstallHost); ok {

	err = installHost.HostInfos(host,username,password)
	if err != nil {
		log.Errorf("fatal error, couldn't connect with  %s host", host)
		return err
	} else {

		return nil
	}
}
return nil
}
