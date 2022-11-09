package main

/*
#include <stdlib.h>
#include <string.h>
typedef void (*CBFunction)(void*, unsigned);
static inline void Invoke(void* res, CBFunction* callback) {
	char* cstr = (char*)res;
	(*callback)(res, strlen(cstr));
}
*/
import "C"
import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"
	"unsafe"

	"github.com/michimani/gotwi"
	"github.com/michimani/gotwi/tweet/filteredstream"
	"github.com/michimani/gotwi/tweet/filteredstream/types"
)

type StreamJSON struct {
	Error   bool          `json:"error,omitempty"`
	Data    []interface{} `json:"data,omitempty"`
	Message string        `json:"message,omitempty"`
}

var ACCESS_TOKEN = ""

//export setAccessToken
func setAccessToken(token *C.char) *C.void {
	ACCESS_TOKEN = C.GoString(token)
	return nil
}

/**
*	creates a new gotwi.Client with a custom
* http.Client and arbitrary timeout arg
 */
func newGotwiClientWithTimeout(timeout int, token string) (*gotwi.Client, error) {
	in := &gotwi.NewClientWithAccessTokenInput{
		AccessToken: token,
		HTTPClient: &http.Client{
			Timeout: time.Duration(timeout) * time.Second,
		},
	}
	return gotwi.NewClientWithAccessToken(in)
}

/**
*	FFI Export: used to list search stream rules
 */
//export listSearchStreamRules
func listSearchStreamRules() *C.char {
	fmt.Println("start - listSearchStreamRules")
	c, err := newGotwiClientWithTimeout(30, ACCESS_TOKEN)
	if err != nil {
		errFmt := &StreamJSON{
			Error:   true,
			Message: err.Error(),
		}
		errJSON, _ := json.Marshal(errFmt)
		return C.CString(string(errJSON))
	}

	p := &types.ListRulesInput{}
	res, err := filteredstream.ListRules(context.Background(), c, p)
	if err != nil {
		errFmt := &StreamJSON{
			Error:   true,
			Message: err.Error(),
		}
		errJSON, _ := json.Marshal(errFmt)
		return C.CString(string(errJSON))
	}

	out, err := json.Marshal(res)
	if err != nil {
		errFmt := &StreamJSON{
			Error:   true,
			Message: err.Error(),
		}
		errJSON, _ := json.Marshal(errFmt)
		return C.CString(string(errJSON))
	}
	fmt.Println("end - listSearchStreamRules")
	return C.CString(string(out))
}

//export deleteSearchStreamRule
func deleteSearchStreamRule(rule_id_char *C.char) *C.char {
	fmt.Println("start - deleteSearchStreamRule")
	ruleID := C.GoString(rule_id_char)
	c, err := newGotwiClientWithTimeout(30, ACCESS_TOKEN)
	if err != nil {
		errFmt := &StreamJSON{
			Error:   true,
			Message: err.Error(),
		}
		errJSON, _ := json.Marshal(errFmt)
		return C.CString(string(errJSON))
	}

	p := &types.DeleteRulesInput{
		Delete: &types.DeletingRules{
			IDs: []string{
				ruleID,
			},
		},
	}

	res, err := filteredstream.DeleteRules(context.TODO(), c, p)
	if err != nil {
		errFmt := &StreamJSON{
			Error:   true,
			Message: err.Error(),
		}
		errJSON, _ := json.Marshal(errFmt)
		return C.CString(string(errJSON))
	}

	out, err := json.Marshal(res)
	if err != nil {
		errFmt := &StreamJSON{
			Error:   true,
			Message: err.Error(),
		}
		errJSON, _ := json.Marshal(errFmt)
		return C.CString(string(errJSON))
	}
	fmt.Println("end - deleteSearchStreamRule")
	return C.CString(string(out))
}

/**
*	adds a rule to the search stream
 */
//export addSearchStreamRule
func addSearchStreamRule(keyword_char *C.char) *C.char {
	fmt.Println("start - addSearchStreamRule")
	keyword := C.GoString(keyword_char)
	c, err := newGotwiClientWithTimeout(30, ACCESS_TOKEN)
	if err != nil {
		errFmt := &StreamJSON{
			Error:   true,
			Message: err.Error(),
		}
		errJSON, _ := json.Marshal(errFmt)
		return C.CString(string(errJSON))
	}

	p := &types.CreateRulesInput{
		Add: []types.AddingRule{
			{Value: gotwi.String(keyword), Tag: gotwi.String(keyword)},
		},
	}

	res, err := filteredstream.CreateRules(context.TODO(), c, p)
	if err != nil {
		errFmt := &StreamJSON{
			Error:   true,
			Message: err.Error(),
		}
		errJSON, _ := json.Marshal(errFmt)
		return C.CString(string(errJSON))
	}

	out, err := json.Marshal(res)
	if err != nil {
		errFmt := &StreamJSON{
			Error:   true,
			Message: err.Error(),
		}
		errJSON, _ := json.Marshal(errFmt)
		return C.CString(string(errJSON))
	}
	fmt.Println("end - addSearchStreamRule")
	return C.CString(string(out))
}

//export execSearchStream
func execSearchStream(callback C.CBFunction) {
	f := &callback
	fmt.Println("start - execSearchStream")
	c, err := newGotwiClientWithTimeout(120, ACCESS_TOKEN)
	if err != nil {
		errFmt := &StreamJSON{
			Error:   true,
			Message: err.Error(),
		}
		errJSON, _ := json.Marshal(errFmt)
		str := unsafe.Pointer(C.CString(string(errJSON)))
		// defer C.free(str)
		C.Invoke(str, f)
	}

	p := &types.SearchStreamInput{}
	s, err := filteredstream.SearchStream(context.Background(), c, p)
	if err != nil {
		fmt.Println(err)
	}
	feed := []interface{}{}
	cnt := 0
	for s.Receive() {
		t, err := s.Read()
		if err != nil {
			fmt.Println(err)
		} else {
			if t != nil {
				cnt++
				// TODO: might need to parse tweets as they come in?
				feed = append(feed, t)
			}
		}

		if cnt > 10 {
			s.Stop()
			break
		}
	}
	out_data := &StreamJSON{
		Data: feed,
	}
	out, err := json.Marshal(out_data)
	if err != nil {
		fmt.Println(err)
		errFmt := &StreamJSON{
			Error:   true,
			Data:    feed,
			Message: err.Error(),
		}
		errJSON, _ := json.Marshal(errFmt)
		str := unsafe.Pointer(C.CString(string(errJSON)))
		// defer C.free(str)
		C.Invoke(str, f)
	}
	fmt.Println(string(out))
	str := unsafe.Pointer(C.CString(string(out)))
	// defer C.free(str)
	fmt.Println("end - execSearchStream")
	C.Invoke(str, f)
}

func main() {} // unused, but required for compile
