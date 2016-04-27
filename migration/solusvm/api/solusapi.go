package api

import (
 "fmt"
  "errors"
  "strings"

  "github.com/megamsys/solusvm_go/solusvm"
  "github.com/megamsys/megdcui/automation"
)
const (
  Success = "success"
)
type SolusClient struct {
  client *solusvm.Client
}



func (s *SolusClient) GetNodes(h *automation.HostInfo) error {
  s.client = solusvm.NewClient(nil,"https://"+ h.SolusMaster + ":5656/api/admin/command.php")
  nodes, _, err := s.client.SolusNodes.ListNodes(map[string]string{ "id":""+ h.Id +"","key":""+ h.Key +"","rdtype": "json", "type":"kvm"})
  if err != nil {
    return err
  }
  h.NodeIds = strings.Split(*nodes.Nodes,",")
  for i := range h.NodeIds {
    s.client = solusvm.NewClient(nil,"https://"+ h.SolusMaster + ":5656/api/admin/command.php")
    nodeinfo, _, Err := s.client.SolusNodes.NodeInfo(map[string]string{ "id":""+ h.Id +"","key":""+ h.Key +"","rdtype": "json", "nodeid":""+ h.NodeIds[i] +""})
    if Err != nil {
      return Err
    }

    if CheckStatus(*nodeinfo.Status, *nodeinfo.Statusmsg) == nil {
      if *nodeinfo.NodeIp == h.SolusNode {
        h.NodeId = h.NodeIds[i]
        return nil
      }
    }
  }

  return errors.New("Can not find given node ip")
}

func (s *SolusClient) GenVirtualMachines(h *automation.HostInfo) error {
  nodeid := h.NodeId
  s.client = solusvm.NewClient(nil,"https://"+ h.SolusMaster + ":5656/api/admin/command.php")
  servers, _, err := s.client.VirtualServers.ListAllVMs(map[string]string{ "id":""+ h.Id +"","key":""+ h.Key +"","rdtype": "json", "nodeid": ""+ nodeid +""})
  if err != nil {
    return err
  }
  err = CheckStatus(*servers.Status, *servers.Statusmsg)
  if  err != nil {
    return err
  }
  vs := *servers.VirtualServers
  for i,_ := range vs {

    clients, _, err := s.client.SolusClients.ListAllClients(map[string]string{ "id":""+ h.Id +"","key":""+ h.Key +"","rdtype": "json"})
    if err != nil {
      return err
    }
    err = CheckStatus(*clients.Status, *clients.Statusmsg)
    if  err != nil {
      return err
    }
    cl := *clients.SolusClients
    for j,_ := range cl {
      if *vs[i].Clientid == *cl[j].Id {
        vm, _, err := s.client.VirtualServers.VServerInfo(map[string]string{ "id":""+ h.Id +"","key":""+ h.Key +"", "rdtype": "json", "vserverid":""+ *vs[i].Vserverid +""})
        if err != nil {
          return err
        }
        err = CheckStatus(*clients.Status, *clients.Statusmsg)
        if  err != nil {
          return err
        }
          orgs,er := getOrgId(*cl[j].Email)
          if  er != nil {
            return er
          }
          err = storeVirtualMachine(vm, orgs.Id)
          if err != nil {
            return err
          }
          fmt.Printf("\n\t %s is created by client :%s",*vs[i].Ctid_xid, *cl[j].FirstName )
      }
   }
  }

  return CheckStatus(*servers.Status, *servers.Statusmsg)
}

func (s *SolusClient) GetClients(h *automation.HostInfo) error {
  s.client = solusvm.NewClient(nil,"https://"+ h.SolusMaster + ":5656/api/admin/command.php")
  clients, _, err := s.client.SolusClients.ListAllClients(map[string]string{ "id":""+ h.Id +"","key":""+ h.Key +"","rdtype": "json"})
  if err != nil {
    return err
  }
  err = CheckStatus(*clients.Status, *clients.Statusmsg)
  if  err != nil {
    return err
  }
  err = storeAccounts(clients)
  if err != nil {
    return err
  }
  return nil
}

func CheckStatus(status, statusmsg string) error {
  if status != Success {
      return errors.New(statusmsg)
    }
  return nil
}
