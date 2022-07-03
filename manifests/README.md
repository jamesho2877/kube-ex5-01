# Manifest files

Location
```bash
$ pwd
> /menifests
```

Define new Custom Resource Definition
```bash
kubectl apply -f dummysite_crd.yaml
```

Create necessary role, service account and binding
```bash
kubectl apply -k .
```

Finally, change to a desired website URL & create resouce
```bash
kubectl apply -f dummysite_resource.yaml
```

Quickly check cloned website
```bash
kubectl port-forward dummysite-stackoverflow-com-job-xxxxx 3600:3600
```