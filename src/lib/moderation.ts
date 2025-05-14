import Green20220302, * as $Green20220302 from '@alicloud/green20220302';
import * as $OpenApi from '@alicloud/openapi-client';
import * as $Util from '@alicloud/tea-util';
import Credential, * as $Credential from '@alicloud/credentials';

const credentialsConfig = new $Credential.Config({
    type: 'access_key',
    accessKeyId: process.env.ALIYUN_ACCESSKEY_ID || "",
    accessKeySecret: process.env.ALIYUN_ACCESSKEY_SECRET || "",
});
let credential = new Credential(credentialsConfig);
let config = new $OpenApi.Config({
    credential: credential,
});
config.endpoint = `green-cip.cn-shanghai.aliyuncs.com`;
let client = new Green20220302(config);

export async function textModeration(content: string): Promise<{ isGood: boolean, labels: string }> {
    let textModerationRequest = new $Green20220302.TextModerationRequest({
        service: "chat_detection",
        serviceParameters: JSON.stringify({
            content: content
        }),
    });
    let runtime = new $Util.RuntimeOptions({});
    try {
        let response = await client.textModerationWithOptions(textModerationRequest, runtime);
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
