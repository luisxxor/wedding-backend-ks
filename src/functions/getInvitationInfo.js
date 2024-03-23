module.exports.handler = async (event) => {

    try {
        const invitationId = event.queryStringParameters.invitationId;
        const AWS = require('aws-sdk');
        const s3 = new AWS.S3();
    
        console.log('Invitation ID: ', invitationId);
        
        const params = {
            Bucket: 'luis-y-mariana-wedding-private',
            Key: 'wedding-db.csv',
            ExpressionType: 'SQL',
            Expression: `select * from s3object s where s.code = '${invitationId}'`,
            InputSerialization: {
                CSV: {
                    FileHeaderInfo: 'USE',
                    RecordDelimiter: '\n',
                    FieldDelimiter: ','
                }
            },
            OutputSerialization: {
                JSON: {
                    RecordDelimiter: '\n'
                }
            }
        };
    
        const data = await s3.selectObjectContent(params).promise();
    
        const eventStream = data.Payload;
    
        const invitationInfo = [];
    
        for await (const event of eventStream) {
            if (event.Records) {
                const payload = event.Records.Payload.toString();
                const records = payload.split('\n');

                records.forEach(record => {
                    if (record) {
                        invitationInfo.push(JSON.parse(record));
                    }
                });
            }
        }
    
        return {
            statusCode: 200,
            body: JSON.stringify(invitationInfo),
            headers: {
                'Access-Control-Allow-Origin': '*',
            },
        };
    } catch (err) {
        console.log('Error: ', err);
        return {
            statusCode: 500,
            body: {
                message: JSON.stringify(err),
                metadata: {
                    requestBody: event.body
                },
            },
            headers: {
                'Access-Control-Allow-Origin': '*',
            },
        };
    }
};