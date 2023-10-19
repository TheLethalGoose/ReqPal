import AlertService from "@/services/util/alert.service.ts";
import {PrivilegeError, DatabaseError, ConversionError, AuthenticationError} from "@/errors/custom.errors.ts";

const unhandledRejectionHandler = (event: PromiseRejectionEvent): void => {

    const error = event.reason;

    if (error instanceof PrivilegeError) {
        AlertService.addErrorAlert("Sie haben nicht die nötigen Rechte um diese Aktion auszuführen.");
        return;
    }

    if (error instanceof ConversionError) {
        AlertService.addErrorAlert("Fehler im Format der CSV Datei.");
        return;
    }

    if (error instanceof DatabaseError) {
        AlertService.addErrorAlert("Es ist ein Fehler mit der Datenbank aufgetreten.");
        return;
    }

    if (error instanceof AuthenticationError) {
        AlertService.addErrorAlert("Feher bei der Anmeldung/Registrierung/Zurücksetzen des Passworts.");
        return;
    }

    AlertService.addErrorAlert("Ein unerwarteter Fehler ist aufgetreten.");

};

const globalErrorHandler = (event: ErrorEvent): void => {
    console.log(event);
    AlertService.addErrorAlert("Ein unerwarteter Fehler ist aufgetreten.");
};

export { unhandledRejectionHandler, globalErrorHandler };