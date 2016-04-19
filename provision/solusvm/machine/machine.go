package machine

import (
	//"encoding/json"
	"fmt"
	"io"
//	"strings"
//	"time"

//	log "github.com/Sirupsen/logrus"
//	nsqp "github.com/crackcomm/nsqueue/producer"
//	"github.com/megamsys/opennebula-go/compute"
	//"github.com/megamsys/megdcui/meta"
	"github.com/megamsys/megdcui/provision"
)

type OneProvisioner interface {

}

type Machine struct {
	Name       string
	Id         string
	CartonId   string
	AccountsId string
	Image      string
	Routable   bool
	Status     provision.Status
}

type CreateArgs struct {
	Commands    []string
	Box         *provision.Box
	Deploy      bool
	Provisioner OneProvisioner
}


//it possible to have a Notifier interface that does this, duck typed b y Assembly, Components.
func (m *Machine) SetStatus(status provision.Status) error {
  fmt.Println("*****************machine*****************")
	return nil
}

func (m *Machine) Exec(p OneProvisioner, stdout, stderr io.Writer, cmd string, args ...string) error {
	cmds := []string{"/bin/bash", "-lc", cmd}
	cmds = append(cmds, args...)

	//load the ssh key inmemory
	//ssh and run the command
	//sshOpts := ssh.CreateExecOptions{
	//}

	//if err != nil {
	//	return err
	//}

	return nil

}
