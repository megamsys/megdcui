package handlers

import (
	"net/http"
		log "github.com/Sirupsen/logrus"
		"github.com/megamsys/megdcui/install"
		_ "github.com/megamsys/megdcui/install"
)

func DataStore(w http.ResponseWriter, r *http.Request) error {
	var register install.Host
host := "localhost"
username := ""
password := ""
poolname := "one"
vgname := "vg-one-0"
hostname := ""

a, err := install.Get(defaultHost)

if err != nil {
	log.Errorf("fatal error, couldn't locate the Host %s", defaultHost)
	return err
}
register = a

if installHost, ok := register.(install.InstallHost); ok {

	err = installHost.CreateDatastore(poolname, vgname, hostname, host,username,password)
	if err != nil {
		log.Errorf("fatal error, couldn't connect with  %s host", host)
		return err
	} else {

		return nil
	}
}
return nil
}
