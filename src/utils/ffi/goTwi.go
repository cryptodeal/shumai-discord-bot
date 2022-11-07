package main

/*
#include <stdlib.h>
#include <string.h>
typedef void (*CBFunction)(void*);
static inline void Invoke(void* res, CBFunction *callback) {
	char* string = (char*)res;
	(*callback)(res); 
}
*/
import "C"
import "encoding/json"
import "context"
import "net/http"
import "fmt"
import "unsafe"
import "time"
import "github.com/michimani/gotwi"
import "github.com/michimani/gotwi/tweet/filteredstream"
import "github.com/michimani/gotwi/tweet/filteredstream/types"

type ErrorJSON struct {
	Error		bool		`json:"error,omitempty"`
	Data		[]interface{}		`json:"data,omitempty"`
	Message		string		`json:"message,omitempty"`
}


var ACCESS_TOKEN = "";

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
	c, err := newGotwiClientWithTimeout(30, ACCESS_TOKEN)
	if err != nil {
		errFmt := &ErrorJSON{
		Error: true,
		Message: err.Error()}
		errJSON, _ := json.Marshal(errFmt)
		return C.CString(string(errJSON))
	}

	p := &types.ListRulesInput{}
	res, err := filteredstream.ListRules(context.Background(), c, p)
	if err != nil {
		errFmt := &ErrorJSON{
		Error: true,
		Message: err.Error()}
		errJSON, _ := json.Marshal(errFmt)
		return C.CString(string(errJSON))
	}

	out, err := json.Marshal(res)
	if err != nil {
		errFmt := &ErrorJSON{
		Error: true,
		Message: err.Error()}
		errJSON, _ := json.Marshal(errFmt)
		return C.CString(string(errJSON))
	}
	return C.CString(string(out))
}

//export deleteSearchStreamRule
func deleteSearchStreamRule(rule_id_char *C.char) *C.char {
	ruleID := C.GoString(rule_id_char)
	c, err := newGotwiClientWithTimeout(30, ACCESS_TOKEN)
	if err != nil {
		errFmt := &ErrorJSON{
		Error: true,
		Message: err.Error()}
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
		errFmt := &ErrorJSON{
		Error: true,
		Message: err.Error()}
		errJSON, _ := json.Marshal(errFmt)
		return C.CString(string(errJSON))
	}

	out, err := json.Marshal(res)
	if err != nil {
		errFmt := &ErrorJSON{
		Error: true,
		Message: err.Error()}
		errJSON, _ := json.Marshal(errFmt)
		return C.CString(string(errJSON))
	}
	return C.CString(string(out))
}

/**
	*	adds a rule to the search stream
	*/
//export addSearchStreamRule
func addSearchStreamRule(keyword_char *C.char) *C.char {
	keyword := C.GoString(keyword_char)
	c, err := newGotwiClientWithTimeout(30, ACCESS_TOKEN)
	if err != nil {
		errFmt := &ErrorJSON{
		Error: true,
		Message: err.Error()}
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
		errFmt := &ErrorJSON{
		Error: true,
		Message: err.Error()}
		errJSON, _ := json.Marshal(errFmt)
		return C.CString(string(errJSON))
	}

	out, err := json.Marshal(res)
	if err != nil {
		errFmt := &ErrorJSON{
		Error: true,
		Message: err.Error()}
		errJSON, _ := json.Marshal(errFmt)
		return C.CString(string(errJSON))
	}
	return C.CString(string(out))
}


//export execSearchStream
func execSearchStream(callback *C.CBFunction) {
	fmt.Println("execSearchStream")
	fmt.Println(callback)
	c, err := newGotwiClientWithTimeout(120, ACCESS_TOKEN)
	if err != nil {
		errFmt := &ErrorJSON{
		Error: true,
		Message: err.Error()}
		errJSON, _ := json.Marshal(errFmt)
		str := unsafe.Pointer(C.CString(string(errJSON)))
		defer C.free(str)
		C.Invoke(str, callback)
	}

	p := &types.SearchStreamInput{}
	s, err := filteredstream.SearchStream(context.Background(), c, p)
	if err != nil {
		errFmt := &ErrorJSON{
		Error: true,
		Message: err.Error()}
		errJSON, _ := json.Marshal(errFmt)
		str := unsafe.Pointer(C.CString(string(errJSON)))
		defer C.free(str)
		C.Invoke(str, callback)
	}
  feed := []interface{}{}
	cnt := 0
	for s.Receive() {
		t, err := s.Read()
		if err != nil {
			errFmt := &ErrorJSON{
			Error: true,
			Data: feed,
			Message: err.Error()}
			errJSON, _ := json.Marshal(errFmt)
			str := unsafe.Pointer(C.CString(string(errJSON)))
			defer C.free(str)
			C.Invoke(str, callback)
		} else {
			if t != nil {
				cnt++
				feed = append(feed, t)
				
					out, err := json.Marshal(feed)
					if err != nil {
						errFmt := &ErrorJSON{
						Error: true,
						Data: feed,
						Message: err.Error()}
						errJSON, _ := json.Marshal(errFmt)
						str := unsafe.Pointer(C.CString(string(errJSON)))
						defer C.free(str)
						C.Invoke(str, callback)
					}
					str := unsafe.Pointer(C.CString(string(out)))
					fmt.Println(str)
					defer C.free(str)
					C.Invoke(str, callback)
			}
		}

		if cnt > 100 {
			s.Stop() 
			break
		}
	}
	out, err := json.Marshal(feed)
	if err != nil {
		errFmt := &ErrorJSON{
		Error: true,
		Data: feed,
		Message: err.Error()}
		errJSON, _ := json.Marshal(errFmt)
		str := unsafe.Pointer(C.CString(string(errJSON)))
		defer C.free(str)
		C.Invoke(str, callback)
	}
	str := unsafe.Pointer(C.CString(string(out)))
	defer C.free(str)
	C.Invoke(str, callback)
}

func main() {} // unused, but required for compile