package api

import (

	"net/http"
  "fmt"

	"gopkg.in/check.v1"
)

func (s *S) TestHealthCheck(c *check.C) {
	request, err := http.NewRequest("GET", "/migrate", nil)
  fmt.Printf("\n\nRequest :%#v ",request.URL)
	c.Assert(err, check.IsNil)

}
