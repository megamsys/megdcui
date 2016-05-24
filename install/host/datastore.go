package host

import (
   "github.com/megamsys/megdcui/install"
  "github.com/megamsys/megdc/handler"
)

var DATASTORE = []string{"CreateDatastoreLvm"}

type CreateDatastoreLvm struct {
	All              bool
	CreateDatastoreLvm    bool
	PoolName string
  VgName  string
	Hostname string
	Username string
	Password string
	Host string
}




func (i *CreateDatastoreLvm) CreateDatastore(poolname, vgname, hostname, host,username,password string) error  {

a := CreateDatastoreLvm{All: false, CreateDatastoreLvm: true,  PoolName: poolname,  VgName: vgname, Hostname: hostname,  Host: host, Username: username, Password: password }
  c := handler.NewWrap(&a)
  err := install.Runner(DATASTORE, c)
  if err !=nil {
    return err
  }
return nil
}
