import { KubeConfig, CoreV1Api, Watch } from "@kubernetes/client-node";
import mustache from "mustache";
import request from "request";
// import JSONStream from "json-stream";
import { readFile } from "node:fs/promises";


const group = "stable.jms";
const kc = new KubeConfig();

process.env.NODE_ENV === "development"
  ? kc.loadFromDefault()
  : kc.loadFromCluster();

// side-effect applies to opts
// as auth properties will be contained (ca, key, cert)
const opts = {};
kc.applyToRequest(opts);

// const k8sApi = kc.makeApiClient(CoreV1Api);
const kcServer = kc.getCurrentCluster().server;
console.log("kcServer", kcServer);

// a bug in k8sApi was fixed by sending a ghost request to it
// (await k8sApi.listPodForAllNamespaces()).body;

// seek for dummysite custom resource
watchDataStream(
  `/apis/${group}/v1/dummysites`,
  async (type, object) => {
    console.log("\nAction:", type);

    const jobFields = prepareJobFields(object);
  
    if (type === "ADDED") {
      // bypass if job for this particular resource is already existed
      if (await isJobExistedForGivenResource(jobFields)) return;

      createJobForGivenResource(jobFields);
    } else if (type === "DELETED") {
      removeJobsAndPodsForGivenResource(jobFields);
    }
  },
);



async function isJobExistedForGivenResource({ ns, jobName }) {
  const jobs = await fetchKCAPI(`/apis/batch/v1/namespaces/${ns}/jobs`);
  return jobs.items.find(job => job.name === jobName);
}

async function removeJobsAndPodsForGivenResource({ ns, jobName }) {
  const jobs = await fetchKCAPI(`/apis/batch/v1/namespaces/${ns}/jobs`);

  jobs.items.forEach(job => {
    if (job.metadata.name !== jobName) return;
    removeJob({ ns, jobName });
  });
}

async function createJobForGivenResource(jobFields) {
  const jobYAML = await generateJobYAML(jobFields);
  
  const opts = {
    headers: { "Content-Type": "application/yaml" },
    body: jobYAML,
  };
  
  const rs = await fetchKCAPI(`/apis/batch/v1/namespaces/${jobFields.ns}/jobs`, "post", opts);
  console.log(`Scheduled job "${rs.metadata.name}" to namespace "${rs.metadata.namespace}"`);
  console.log("Job status", rs.status);

  return rs;
}

async function removeJob({ ns, jobName }) {
  const rs = await fetchKCAPI(`/apis/batch/v1/namespaces/${ns}/jobs/${jobName}`, "delete");
  console.log(`Removed job "${rs.metadata.name}" from namespace "${rs.metadata.namespace}"`);
  console.log("Job status", rs.status);

  // remove related pods
  const pods = await fetchKCAPI(`/api/v1/namespaces/${ns}/pods`);
  pods.items
    .filter(pod => pod.metadata.labels["job-name"] === jobName)
    .forEach(pod => removePod({ ns, podName: pod.metadata.name }));

  return rs;
}

async function removePod({ ns, podName }) {
  const rs = await fetchKCAPI(`/api/v1/namespaces/${ns}/pods/${podName}`, "delete");
  console.log(`Removed pod "${rs.metadata.name}" from namespace "${rs.metadata.namespace}"`);

  return rs;
}

async function fetchKCAPI(api, method = "get", options = {}) {
  return new Promise((resolve, reject) => {
    const reqOpts = {
      ...opts,
      ...options,
      headers: {
        ...(opts.headers || {}),
        ...(options.headers || {}),
      },
    };

    return request[method](
      `${kcServer}${api}`,
      reqOpts,
      (err, res) => (err ? reject(err) : resolve(JSON.parse(res.body))),
    );
  });
}

async function generateJobYAML(fields) {
  const deploymentTemplate = await readFile("job.mustache", "utf-8");
  return mustache.render(deploymentTemplate, fields);
}

function watchDataStream(streamURL, handleFunc) {
  return new Watch(kc).watch(
    streamURL,
    {},
    handleFunc,
    (err) => console.log("err", err)
  );
}

function prepareJobFields(object) {
  const resourceName = object.metadata.name;
  const resourceUID = object.metadata.uid.slice(-5);
  const websiteURL = object.spec.website_url;

  return {
    containerName: `${resourceName}-dep`,
    ns: object.metadata.namespace,
    image: object.spec.image,
    jobName: `${resourceName}-job-${resourceUID}`,
    website_url: websiteURL,
  };
}