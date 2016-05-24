package handlers

import (
	"net/http"
	"io/ioutil"
	log "github.com/Sirupsen/logrus"
	"github.com/megamsys/megdcui/install"
	_ "github.com/megamsys/megdcui/install/machine"
	"fmt"
)
const(
	defaultHost = "host"
)

func HostInfosContent(w http.ResponseWriter, r *http.Request) error {

	body, err1 := ioutil.ReadAll(r.Body)
    if err1 != nil {
      http.Error(w, err1.Error(), 400)
      return err1
    }
		fmt.Println("--------------new infos-----------")
		fmt.Println(string(body))

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

func HostInfosInstall(w http.ResponseWriter, r *http.Request) error {
		return nil
}
