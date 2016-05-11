package handlers

import (
	"net/http"
		log "github.com/Sirupsen/logrus"
		"github.com/megamsys/megdcui/install"
		_ "github.com/megamsys/megdcui/install/machine"
)

func HostCheck(w http.ResponseWriter, r *http.Request) error {
	var register install.Host
host := "localhost"
username := ""
password := ""
a, err := install.Get(defaultHost)

if err != nil {
	log.Errorf("fatal error, couldn't locate the Server %s", defaultHost)
	return err
}
register = a

if installHost, ok := register.(install.InstallHost); ok {

	err = installHost.HostCheck(host,username,password)
	if err != nil {
		log.Errorf("fatal error, couldn't connect with  %s host", host)
		return err
	} else {

		return nil
	}
}
return nil
}
