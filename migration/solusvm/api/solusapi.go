package api

import (
  "fmt"

  "github.com/megamsys/solusvm_go/solusvm"
)

type SolusClient struct {
  client *solusvm.Client
  vs     *solusvm.VServers
}

func (s *SolusClient) GetClients(masterip, id, key string) error {
  IP := masterip
  s.client = solusvm.NewClient(nil,"https://"+ IP + ":5656/api/admin/command.php")
  servers, _, err := s.client.VirtualServers.ListAll(map[string]string{ "id":""+ "iy9rRvifGKajunciPcu5V13ANyAmVnvklN2HV8cv" +"","key":""+ "8mQloZ1rjkl6bevOCW2o0mykZpSLnV8l8OwmCnEN" +"", "action": "node-virtualservers", "rdtype": "json", "nodeid":"4"})
  if err != nil {
    return err
  }
  fmt.Printf("%s",*servers.Status)
  return nil
}
