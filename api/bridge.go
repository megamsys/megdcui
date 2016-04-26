package api

import (
	"net/http"
		log "github.com/Sirupsen/logrus"
		"github.com/megamsys/megdcui/install"
		_ "github.com/megamsys/megdcui/install"
)

func bridge(w http.ResponseWriter, r *http.Request) error {
	var register install.Host
host := "localhost"
username := ""
password := ""
bridgename := "one"
  phydev := "eth0"
	network := "103.56.92.0"
	netmask := "255.255.252.0"
	gateway := "103.56.92.1"
	dnsname1 := "8.8.8.8"
	dnsname2 := "8.8.4.4"
a, err := install.Get(defaultHost)

if err != nil {
	log.Errorf("fatal error, couldn't locate the Host %s", defaultHost)
	return err
}
register = a

if installHost, ok := register.(install.InstallHost); ok {

	err = installHost.CreateBridge(bridgename, phydev, network, netmask, gateway, dnsname1, dnsname2,host,username,password)
	if err != nil {
		log.Errorf("fatal error, couldn't connect with  %s host", host)
		return err
	} else {

		return nil
	}
}
return nil
}
