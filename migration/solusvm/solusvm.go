package solusvm

import (
	//"fmt"
	log "github.com/Sirupsen/logrus"
	"github.com/megamsys/megdcui/migration"
	"github.com/megamsys/libgo/action"
)

func init() {
	migration.Register("solusvm", solusvmManager{})
}

type solusvmManager struct{}

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
