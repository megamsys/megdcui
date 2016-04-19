package api

import (
	"encoding/json"
	"fmt"
	"net/http"
	"github.com/megamsys/libgo/hc"
)

func ping(w http.ResponseWriter, r *http.Request) error {
	fmt.Println("**************api/ping******************")
	data, _ := json.MarshalIndent(fullHealthcheck(w, r), "", "  ")
	err := pingTemplate.Execute(w, map[string]interface{}{
		"data": string(data),
	})
	if err != nil {
		return err
	}
	return nil
}

func fullHealthcheck(w http.ResponseWriter, r *http.Request) []hc.Result {
	results := hc.Check()
	status := http.StatusOK
	for _, result := range results {
		if result.Status != hc.HealthCheckOK {
			status = http.StatusInternalServerError
		}
	}
	w.WriteHeader(status)
	return results
}
