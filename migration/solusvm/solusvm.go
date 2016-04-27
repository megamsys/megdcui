package solusvm

import (
	log "github.com/Sirupsen/logrus"
	"github.com/megamsys/megdcui/migration"
	"github.com/megamsys/libgo/action"
	"gopkg.in/yaml.v2"
)

func init() {
	migration.Register("solusvm", solusvmManager{})
}

type solusvmManager struct{}

type VirtualServer struct {
	Vserverid   	*string `json:"vserverid"`
	Ctid_xid    	*string `json:"ctid-xid"`
	Clientid      *string `json:"clientid"`
	Ipaddress     *string `json:"ipaddress"`
	Hostname      *string `json:"hostname"`
	Template      *string `json:"template"`
	Hdd    				*string `json:"hdd"`
	Memory     		*string `json:"memory"`
	Swap_burst 		*string `json:"swap-burst"`
	Type    			*string `json:"type"`
	Mac      			*string `json:"mac"`
}

type VServers struct {
	Status     *string `json:"status"`
	Statusmsg  *string `json:"statusmsg"`
	VirtualServers *[]VirtualServer `json:"virtualservers"`
	Org_id     string
}

func (b *VirtualServer) String() string {
	if d, err := yaml.Marshal(b); err != nil {
		return err.Error()
	} else {
		return string(d)
	}
}

func (m solusvmManager) MigratablePrepare(ip, id, key string) error {

	actions := []*action.Action{
		&VertifyMigratableCredentials,
		//&VerfiyMigrationComplete,
	}
	pipeline := action.NewPipeline(actions...)

	args := runActionsArgs{
    id:         id,
		key:        key,
		masterip:   ip,
	}

	err := pipeline.Execute(args)
	if err != nil {
		log.Errorf("error on execute status pipeline for github %s - %s", ip, err)
		return err
	}
	return nil

}
func (m solusvmManager) MigrateHost(hostip, user, pass string) error {
/*
	actions := []*action.Action{

	}
	pipeline := action.NewPipeline(actions...)

	s := strings.Split(url, "/")[4]
	s1 := strings.Split(tar_url, "/")[6]
	args := runActionsArgs{
		hostip:         hostip,
		username:     user,
		password:   pass,
	}

	err := pipeline.Execute(args)
	if err != nil {
		log.Errorf("error on execute status pipeline for github %s - %s", hostip, err)
		return err
	}*/
	return nil

}
