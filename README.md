# CRD & Controller

This project includes solutions for the following exercises:

* Exercise 5.01: DIY CRD & Controller
* (Q/A) Exercise 5.03: Learn from external material
* (Q/A) Exercise 5.04: Platform comparison

---

## Q/A exersices

In this section, please forgive my knowledge limitation if you found unreasonable somewhere.

### Exercise 5.03: Learn from external material
`-k` in `kubectl -k` is a shorthand for `--kustomize`. This tell `kubectl` to read the configuration from [linkerd repo](https://github.com/fluxcd/flagger/blob/main/kustomize/linkerd/kustomization.yaml) where the instruction for installation/destruction is given following `apply`/`delete` command.

I am not familiar with script command so here is the screenshot at the end of the task regarding canary release in Service Meshes.

!['Traffic split after the new version of the app was gradually rolled out'](image/traffic_split.png)

### Exercise 5.04: Platform comparison
||Rancher|OpenShift|
|-|:-:|:-:|
|Can be installed any distribution that has Docker|x||
|Installation and upgrade are easier and faster|x||
|Able to control the whole machine||x|
|Well-integrated with eco-system of Red Hat||x|
|Cost efficient|x||
|Better security coverage||x|

I think Rancher is suitable to organizations where using Red Hat's products is not a must. In addtion, it is low-cost, open-sourced and more selection. Not like OpenShift, choosing to have more freedom also means more learning, management, setup and responsibility. I believe that largely depends on the goal and scale of the project. As a newcomer, I would pick Rancher to start with and learn all the way up.