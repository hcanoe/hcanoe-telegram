/* functions handling standalone commands */
const bot = {
  /* creates a new spreadsheet,
   * then sends a message containing its url
   */
  create: function (id, tempFolderId) {
    telegram.sendMessage(id, "creating a temporary spreadsheet...");

    /* create a new sheet */
    const newSheet = SpreadsheetApp.create(id + " " + timestamp());

    /* get the user's email */
    const sheet = SpreadsheetApp.openById(userDB).getSheetByName("users");
    const data = utils.arrayToObject(sheet.getDataRange().getValues());
    const me = data.find((e) => e.telegram_id == id);

    /* shares spreadsheet with the user's email */
    newSheet.addEditor(me.email);

    /* moves the new spreadsheet into a fixed folder */
    const source = DriveApp.getFileById(newSheet.getId());
    const target = DriveApp.getFolderById(tempFolderId);
    source.moveTo(target);

    /* sends user the url of the new spreadsheet */
    telegram.sendMessage(
      id,
      "your temporary input sheet url is " + newSheet.getUrl()
    );
  },

  /* lists existing temporary spreadsheets which user created */
  list: function (id, tempFolderId) {
    telegram.sendMessage(id, "listing existing spreadsheets...");

    const folder = DriveApp.getFolderById(tempFolderId);

    /* Gets an array of files under temp folder.
     * Each element is a string of comprising file name and URL.
     */
    var ls = [];
    var files = folder.getFiles(); // object of directory tree
    while (files.hasNext()) {
      var file = files.next();
      const name = file.getName();
      if (name.split(" ")[0] == id) {
        var line = name + " → " + file.getUrl();
        ls.push(line);
      } else {
      }
    }

    /* tells if user has no current temp files */
    if (ls.length == 0) {
      telegram.sendMessage(id, "you have no temp files");
      return;
    }

    /* prints out one filename + url per message */
    ls.forEach((e) => {
      telegram.sendMessage(id, e);
    });
  },

  /* finds spreadsheets associated to user
   * prompts the user with a menu containing a list of all spreadsheet titles.
   *
   * picked spreadsheet will be deleted (currently without confirmation)
   */
  remove: function (id, tempFolderId) {
    telegram.sendMessage(id, "looking for existing spreadsheets...");

    const folder = DriveApp.getFolderById(tempFolderId);

    /* gets an array of files under the temp folder
     * each element is { name, url, id }
     */
    var ls = [];
    var files = folder.getFiles(); // object of directory tree
    while (files.hasNext()) {
      var file = files.next();
      var data = {
        name: file.getName(),
        url: file.getUrl(),
        id: file.getId(),
      };
      ls.push(data);
    }

    /* tells if user has no current temp files */
    if (ls.length == 0) {
      telegram.sendMessage(id, "you have no temp files");
      return;
    }

    /* prompt user with a keyboard of spreadsheet names
     * (pick one to delete it permanently)
     */
    const options = ls.map((file) => [
      {
        text: file.name,
        callback_data: "/remove/" + file.id,
      },
    ]);
    telegram.sendMenu(id, "chose one to delete:", {
      inline_keyboard: options,
    });
  },
  /* searches user database and replies with name of user */
  whoami: function (id, tempFolder, userDB) {
    const sheet = SpreadsheetApp.openById(userDB).getSheetByName("users");
    const data = utils.arrayToObject(sheet.getDataRange().getValues());
    const me = data.find((e) => e.telegram_id == id);
    telegram.sendMessage(id, "you are " + me.name);
  },
};

/* functions handling callback (i.e. input from inline keyboards)
 * [https://core.telegram.org/bots#inline-keyboards-and-on-the-fly-updating]
 */
const callback = {
  remove: function (id, args) {
    /* permanently deletes file matching id supplied in args */
    const filename = DriveApp.getFileById(args).getName();
    telegram.sendMessage(
      id,
      "successfully removed spreadsheet `" + filename + "`"
    );
    Drive.Files.remove(args);
  },
};

/* documentation: https://core.telegram.org/bots/api
 * vim:tw=70
 */
