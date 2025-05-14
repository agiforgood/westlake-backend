const Green20220302 = require('@alicloud/green20220302');
const OpenApi = require('@alicloud/openapi-client');
const Util = require('@alicloud/tea-util');
const Credential = require('@alicloud/credentials');

const credentialsConfig = new Credential.Config({
    type: 'access_key',
    accessKeyId: process.env.ALIYUN_ACCESSKEY_ID,
    accessKeySecret: process.env.ALIYUN_ACCESSKEY_SECRET,
});
const credentialClient = new Credential.default(credentialsConfig);
let config = new OpenApi.Config({
    credential: credentialClient,
});
config.endpoint = 'green-cip.cn-shanghai.aliyuncs.com';
const client = new Green20220302.default(config);

export async function textModeration(content: string): Promise<{ isGood: boolean, labels: string }> {
    let textModerationRequest = new Green20220302.TextModerationRequest({
        service: 'chat_detection',
        serviceParameters: JSON.stringify({
            content: content
        }),
    });
    let runtime = new Util.RuntimeOptions({});
    try {
        const response = await client.textModerationWithOptions(textModerationRequest, runtime);
        const labels = response.body?.data?.labels;
        if (labels && labels.length > 0) {
            return {
                isGood: false,
                labels
            }
        } else {
            return {
                isGood: true,
                labels: "",
            }
        }
    } catch (error) {
        return {
            isGood: false,
            labels: "",
        }
    }
}
