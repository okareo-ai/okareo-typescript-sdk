import { Okareo } from './index';

const OKAREO_API_KEY = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImE0NzE3MzQ3In0.eyJzdWIiOiI1NzY0OTRlMS1mMDdlLTQ4MjMtOGFiMS1lMDVhMjViMTRhOTYiLCJ0eXBlIjoidGVuYW50QWNjZXNzVG9rZW4iLCJ0ZW5hbnRJZCI6ImU2OTNmZDU4LTY4MTctNDU5ZC1hZDY4LWI3ODg5OTkzMWEwOCIsInJvbGVzIjpbIkZFVENILVJPTEVTLUJZLUFQSSJdLCJwZXJtaXNzaW9ucyI6WyJGRVRDSC1QRVJNSVNTSU9OUy1CWS1BUEkiXSwiYXVkIjoiYTQ3MTczNDctOWNhZS00MTRiLThmN2YtZmMwN2VkMDA2NDNkIiwiaXNzIjoiaHR0cHM6Ly9va2FyZW8tZGV2LnVzLmZyb250ZWdnLmNvbSIsImlhdCI6MTcwMTgyMjcyNn0.Qw5HQJ61Y1ZjekQcvcm5cS2OSaD5MsitDjFqmfcqjagYdU6kr3FCWJV-r47raDTLFgusDCUsK-fUnBJrVWvkE6nj6a6aCtGAEEbUj2pQN-b0DgcGuFxeJQx_Izh6uEhKd80FS1TzMpnOOnxptJZNNsoL0MdH4NjiW9qXMwh--drB5nRhpgXZL2P9suYvZtFD2DS07nQ8l7tLpIh5z_bHRlOOul1KyHP9ak3jWNfBmNC3oNQibXnIsA6rkNouqzsnfK5txO9Z7IfQ6qcPZNR0IrM07JVuqU6z5_EeDHSwZtyvLVSiTP5vBp2P7qiucpLeiFfYoqqsXuj9nLa6TfmDwA";

it('Test Get Projects', async () =>  {
  const okareo = new Okareo(OKAREO_API_KEY);
  const data: any[] = await okareo.getProjects();
  expect(data.length).toBeGreaterThanOrEqual(0);
});
