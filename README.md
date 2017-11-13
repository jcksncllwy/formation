<pre>
███████╗ ██████╗ ██████╗ ███╗   ███╗ █████╗ ████████╗██╗ ██████╗ ███╗   ██╗
██╔════╝██╔═══██╗██╔══██╗████╗ ████║██╔══██╗╚══██╔══╝██║██╔═══██╗████╗  ██║
█████╗  ██║   ██║██████╔╝██╔████╔██║███████║   ██║   ██║██║   ██║██╔██╗ ██║
██╔══╝  ██║   ██║██╔══██╗██║╚██╔╝██║██╔══██║   ██║   ██║██║   ██║██║╚██╗██║
██║     ╚██████╔╝██║  ██║██║ ╚═╝ ██║██║  ██║   ██║   ██║╚██████╔╝██║ ╚████║
╚═╝      ╚═════╝ ╚═╝  ╚═╝╚═╝     ╚═╝╚═╝  ╚═╝   ╚═╝   ╚═╝ ╚═════╝ ╚═╝  ╚═══╝
</pre>

Formation is a command-line tool that transports data from completed Typeforms
into a MongoDB database. When run, Formation will check the last time it was
executed and ask Typeform for any forms that have been completed since then.
This makes Formation ideal for usage with crontab or another scheduler to get
regular updates.

Typeform's JSON format is super convenient for MongoDB storage, and can be
inserted with minimal transformation. For the sake of database optimization,
responses are stored in a separate collection, instead of an internal array
within the form document. 

Since a Typeform's questions can be changed, a new form document is saved 
for each poll. The responses gathered during each poll are saved with the
MongoDB _id of the form they came with. In this way, responses to questions
that have been changed on the Typeform can still be mapped to the original
question.

Typeform and MongoDB info is passed in via command line like so:

<pre>
<code>
node formation.js --mongouri            "localhost:27017/formation"
                  --sysCollection       "formationOps"
                  --formsCollection     "forms"
                  --responseCollection  "responses"
                  --typeformUID         "abc123doremi"
                  --typeformKey         "quickbrownfox"
</code>
</pre>


Formation is the formalized version of software I wrote as a sub-contractor for my friend Bjorn. The original repo and commit history can be viewed here: https://github.com/bjorncooley/mongo-analytics.


