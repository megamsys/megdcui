package handlers

import (

	"net/http"
  "fmt"
	"gopkg.in/check.v1"
)

func (s *S) TestHostInfos(c *check.C) {
	request, err := http.NewRequest("GET", "/hostinfos", nil)
  fmt.Printf("\n\nRequest :%#v ",request.URL)
	c.Assert(err, check.IsNil)

}
