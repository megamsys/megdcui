package machine

import (
	log "github.com/Sirupsen/logrus"
"github.com/megamsys/megdcui/install"
	"github.com/megamsys/libgo/action"

)

func init() {
	install.Register("host", hostManager{})
}

type hostManager struct{}


func (m hostManager) HostInfos(host , username, password string) error {

	actions := []*action.Action{
		&CheckHostInfo,

	}
	pipeline := action.NewPipeline(actions...)

	args := runActionsArgs{
     host:         host,
		username:      username,
		password:   password,
	}

	err := pipeline.Execute(args)
	if err != nil {
		log.Errorf("error on execute status pipeline for host %s - %s", host, err)
		return err
	}
	return nil

}
func (m hostManager) HostCheck(host , username, password string) error {

	actions := []*action.Action{
		&HostCheck,
	}
	pipeline := action.NewPipeline(actions...)

	args := runActionsArgs{
     host:         host,
		username:      username,
		password:   password,
	}

	err := pipeline.Execute(args)
	if err != nil {
		log.Errorf("error on execute status pipeline for host %s - %s", host, err)
		return err
	}
	return nil

}

func (m hostManager) CreateBridge(bridgename, phydev, network, netmask, gateway, dnsname1, dnsname2, host, username, password string) error {

	actions := []*action.Action{
		&CreateBridgeAction,

	}
	pipeline := action.NewPipeline(actions...)

	args := runActionsArgs{
		 bridgename: bridgename,
		 iptype:   iptype
		 ip:     ip,
		 phydev:   phydev,
		 network:  network,
		 netmask: netmask,
		 gateway: gateway,
		 dnsname1: dnsname1,
		 dnsname2: dnsname2,
     host:         host,
		username:      username,
		password:   password,
	}

	err := pipeline.Execute(args)
	if err != nil {
		log.Errorf("error on execute status pipeline for host %s - %s", host, err)
		return err
	}
	return nil

}

func (m hostManager) CreateNetwork(bridge, iptype, ip, size, dns1, dns2, netmask, gateway, host,username,password string) error {

	actions := []*action.Action{
		&CreateNetworkAction,

	}
	pipeline := action.NewPipeline(actions...)

	args := runActionsArgs{
		 bridge: bridge,
		 iptype: iptype,
		 ip:   ip,
		 size: size,
		 dns1: dns1,
		 dns2: dns2,
		 netmask: netmask,
		 gateway: gateway,
     host:         host,
		username:      username,
		password:   password,
	}

	err := pipeline.Execute(args)
	if err != nil {
		log.Errorf("error on execute status pipeline for host %s - %s", host, err)
		return err
	}
	return nil

}
