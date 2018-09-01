Import "JSON.clj"


operators {
    fetch_json _:void ( url:string callback:(_:void ( data:JSONDataObject )) error:(_:void ()) ) {
        templates {
            ranger ('(post_json ' (e 1) ' ' (e 2) ' ' (e 3) ' ' (e 4) ')' )
            es6 ( "axios.get(" (e 1) ") .then((res)=>{
                    (("(e 2) ")(res.data));
                })"
                )
            java7 (
                ""
            )
        }
    }
    post_json _@(throws):void  ( url:string data:JSONDataObject callback:(_:void ( data:JSONDataObject )) error:(_:void ()) ) {
        templates {
            ranger ('(post_json ' (e 1) ' ' (e 2) ' ' (e 3) ' ' (e 4) ')' )
            es6 ( "axios.post(" (e 1) ", " (e 2) ") .then((res)=>{
                    (("(e 3) ")(res.data));
                })"
            )
            java7 ( "AsyncPostTest.PostJSONData( (new AsyncPostTest() { " nl I
                        "@Override" nl
                        "protected void onPostExecute(String strData) {" nl I
                            'try {' I
                                (e 3) ".run(new JSONObject(strData)); " nl i
                            '} catch( Exception e) {}' nl i
                        "}" nl i
                    "})," (e 1) ", " (e 2) " ); " (imp "android.os.AsyncTask") 
                    (imp "org.json.JSONObject") (plugin 'maven' (  (dep 'org.json' 'json' '20171018'  ) ) )
(java_class 'AsyncPostTest' `
import android.os.AsyncTask;

import java.io.BufferedReader;
import java.io.DataOutputStream;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import org.json.JSONObject;

class AsyncPostTest extends AsyncTask<String, Void, String> {

    private Exception exception;
    public String dataToSend = "";
    public String urlToSend = "";
    static void PostJSONData( AsyncPostTest req, String url, JSONObject data ) {
        req.dataToSend = data.toString();
        req.urlToSend = url;
        req.execute();
    }
    protected String doInBackground(String... urls) {
        HttpURLConnection urlConnection = null;
        StringBuilder x = new StringBuilder();
        try {

            URL url = new URL(this.urlToSend);
            HttpURLConnection connection = (HttpURLConnection) url.openConnection();
            connection.setConnectTimeout(500);
            connection.setReadTimeout(500);
            // Allow Outputs (sending)
            connection.setDoOutput(true);
            connection.setUseCaches(false);

            // Enable POST method
            connection.setRequestMethod("POST");
            connection.setRequestProperty("Content-Type", "application/json");
            connection.setRequestProperty("charset", "utf-8");
            DataOutputStream printout = new DataOutputStream(connection.getOutputStream());
            printout.write(this.dataToSend.getBytes("UTF8"));
            printout.flush();
            //  Here you read any answer from server.
            BufferedReader serverAnswer = new BufferedReader(new InputStreamReader(connection.getInputStream()));
            String read_data = "";
            String line;
            while ((line = serverAnswer.readLine()) != null) {
                read_data = read_data + line;
            }
            printout.close();
            serverAnswer.close();
            printout.close();
            return read_data;
        } catch (Exception e) {
            e.printStackTrace();
        } finally {
            if (urlConnection != null) {
                urlConnection.disconnect();
            }
        }
        return x.toString();
    }

    protected void onPostExecute(String strData) {
        // TODO: check this.exception
        // TODO: do something with the feed
    }
}

`)                    
                    )
        }
    }

    https_post_json _@(throws):void  ( url:string data:JSONDataObject callback:(_:void ( data:JSONDataObject )) error:(_:void ()) ) {
        templates {
            ranger ('(post_json ' (e 1) ' ' (e 2) ' ' (e 3) ' ' (e 4) ')' )
            es6 ( "axios.post(" (e 1) ", " (e 2) ") .then((res)=>{
                    (("(e 3) ")(res.data));
                })"
            )
            java7 ( "AsyncHttpsPostTest.PostJSONData( (new AsyncHttpsPostTest() { " nl I
                        "@Override" nl
                        "protected void onPostExecute(String strData) {" nl I
                            'try {' I
                                (e 3) ".run(new JSONObject(strData)); " nl i
                            '} catch( Exception e) {'nl I
                                (e 4) ".run(); " nl i
                            '}' nl i
                        "}" nl i
                    "})," (e 1) ", " (e 2) " ); " (imp "android.os.AsyncTask") 
                    (imp "org.json.JSONObject") (plugin 'maven' (  (dep 'org.json' 'json' '20171018'  ) ) )
(java_class 'AsyncHttpsPostTest' `
import android.os.AsyncTask;

import java.io.BufferedReader;
import java.io.DataOutputStream;
import java.io.InputStreamReader;
import javax.net.ssl.HttpsURLConnection;
import java.net.URL;
import org.json.JSONObject;

class AsyncHttpsPostTest extends AsyncTask<String, Void, String> {

    private Exception exception;
    public String dataToSend = "";
    public String urlToSend = "";
    static void PostJSONData( AsyncHttpsPostTest req, String url, JSONObject data ) {
        req.dataToSend = data.toString();
        req.urlToSend = url;
        req.execute();
    }
    protected String doInBackground(String... urls) {
        HttpsURLConnection urlConnection = null;
        StringBuilder x = new StringBuilder();
        try {

            URL url = new URL(this.urlToSend);
            HttpsURLConnection connection = (HttpsURLConnection) url.openConnection();
            connection.setConnectTimeout(500);
            connection.setReadTimeout(500);
            // Allow Outputs (sending)
            connection.setDoOutput(true);
            connection.setUseCaches(false);

            // Enable POST method
            connection.setRequestMethod("POST");
            connection.setRequestProperty("Content-Type", "application/json");
            connection.setRequestProperty("charset", "utf-8");
            DataOutputStream printout = new DataOutputStream(connection.getOutputStream());
            printout.write(this.dataToSend.getBytes("UTF8"));
            printout.flush();
            //  Here you read any answer from server.
            BufferedReader serverAnswer = new BufferedReader(new InputStreamReader(connection.getInputStream()));
            String read_data = "";
            String line;
            while ((line = serverAnswer.readLine()) != null) {
                read_data = read_data + line;
            }
            printout.close();
            serverAnswer.close();
            printout.close();
            return read_data;
        } catch (Exception e) {
            e.printStackTrace();
        } finally {
            if (urlConnection != null) {
                urlConnection.disconnect();
            }
        }
        return x.toString();
    }

    protected void onPostExecute(String strData) {
        // TODO: check this.exception
        // TODO: do something with the feed
    }
}

`)                    
                    )
        }
    }


}
