import { FormBase } from "../form-base";
import { Input, Component, OnInit } from "@angular/core";
import { DateAdapter, MAT_DATE_LOCALE, MAT_DATE_FORMATS, MatDialog, MatDialogConfig } from "@angular/material";
import { MomentDateAdapter } from "@angular/material-moment-adapter";
import { MY_FORMATS, ApplicationType, EnumHelper } from "../enums-list";
import { FormGroup, ControlContainer, FormBuilder, FormArray, Validators, AbstractControl } from "@angular/forms";
import { SignPadDialog } from "../../sign-dialog/sign-dialog.component";
import { POSTAL_CODE } from "../regex.constants";
import { AuthInfoHelper } from "./authorization-information.helper";
import { iLookupData } from "../../models/lookup-data.model";
import { LookupService } from "../../services/lookup.service";


@Component({
    selector: 'app-authorization-information',
    templateUrl: './authorization-information.component.html',
    styleUrls: ['./authorization-information.component.scss'],
    providers: [
        // `MomentDateAdapter` can be automatically provided by importing `MomentDateModule` in your
        // application's root module. We provide it at the component level here, due to limitations of
        // our example generation script.
        { provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE] },
        { provide: MAT_DATE_FORMATS, useValue: MY_FORMATS },
    ],
})
export class AuthorizationInformationComponent extends FormBase implements OnInit {
    @Input() formType: number;
    @Input() lookupData: iLookupData;
    public form: FormGroup;
    ApplicationType = ApplicationType;
    enumHelper = new EnumHelper();

    authorizedPersons: FormArray;
    showAddAuthorizationInformation: boolean = true;
    showRemoveAuthorization: boolean = true;
    postalRegex = POSTAL_CODE;
    authInfoHelper = new AuthInfoHelper();

    relationshipList: string[] = [];

    constructor(
        private controlContainer: ControlContainer,
        private matDialog: MatDialog,
        private fb: FormBuilder,
        public lookupService: LookupService,
    ) {
        super();
    }

    ngOnInit() {
        this.form = <FormGroup>this.controlContainer.control;
        setTimeout(() => { this.form.markAsTouched(); }, 0);
        console.log("auth info component");
        console.log(this.form);

        this.form.get('allowCvapStaffSharing').valueChanges.subscribe(value => {
            let options = { onlySelf: true, emitEvent: false };
            let authorizedPersonAuthorizesDiscussion = this.form.get('authorizedPersonAuthorizesDiscussion');
            let authorizedPersonSignature = this.form.get('authorizedPersonSignature');

            authorizedPersonAuthorizesDiscussion.clearValidators();
            authorizedPersonAuthorizesDiscussion.setErrors(null, options);
            authorizedPersonSignature.clearValidators();
            authorizedPersonSignature.setErrors(null), options;

            let useValidation = value > 100000000;
            if (useValidation) {
                authorizedPersonAuthorizesDiscussion.setValidators([Validators.required]);
                authorizedPersonSignature.setValidators([Validators.required]);
                this.authorizedPersons = this.form.get('authorizedPerson') as FormArray;
                if (this.authorizedPersons.length === 0) {
                    this.addAuthorizationInformation(true);
                }

                //set authorized persons required field
                if (value === 100000001) {
                    console.log("name and rel required");
                    for (let i = 0; i < this.authorizedPersons.length; ++i) {
                        let agencyControl = this.authorizedPersons.controls[i].get('authorizedPersonAgencyName');
                        let authorizedPersonFirstNameControl = this.authorizedPersons.controls[i].get('authorizedPersonFirstName');
                        let authorizedPersonLastNameControl = this.authorizedPersons.controls[i].get('authorizedPersonLastName');
                        let authorizedPersonRelationshipControl = this.authorizedPersons.controls[i].get('authorizedPersonRelationship');

                        this.setControlValidators(authorizedPersonFirstNameControl, [Validators.required]);
                        this.setControlValidators(authorizedPersonLastNameControl, [Validators.required]);
                        this.setControlValidators(authorizedPersonRelationshipControl, [Validators.required]);

                        this.clearControlValidators(agencyControl);
                    }
                }
                else if (value === 100000002) {
                    console.log("name and rel NOT required");
                    for (let i = 0; i < this.authorizedPersons.length; ++i) {
                        let agencyControl = this.authorizedPersons.controls[i].get('authorizedPersonAgencyName');
                        let authorizedPersonFirstNameControl = this.authorizedPersons.controls[i].get('authorizedPersonFirstName');
                        let authorizedPersonLastNameControl = this.authorizedPersons.controls[i].get('authorizedPersonLastName');
                        let authorizedPersonRelationshipControl = this.authorizedPersons.controls[i].get('authorizedPersonRelationship');

                        this.setControlValidators(agencyControl, [Validators.required]);

                        this.clearControlValidators(authorizedPersonFirstNameControl);
                        this.clearControlValidators(authorizedPersonLastNameControl);
                        this.clearControlValidators(authorizedPersonRelationshipControl);
                    }
                }
            }
            else {
                this.clearAuthorizationInformation();
            }

            authorizedPersonAuthorizesDiscussion.updateValueAndValidity(options);
            authorizedPersonSignature.updateValueAndValidity(options);
        });

        if (this.lookupData.relationships && this.lookupData.relationships.length > 0) {
            this.relationshipList = this.lookupData.relationships.map(r => r.vsd_name);
        }
        else {
            this.lookupService.getRelationships().subscribe((res) => {
                this.lookupData.relationships = res.value;
                if (this.lookupData.relationships) {
                    this.lookupData.relationships.sort(function (a, b) {
                        return a.vsd_name.localeCompare(b.vsd_name);
                    });
                }
                this.relationshipList = this.lookupData.relationships.map(r => r.vsd_name);
            });
        }
    }

    addAuthorizationInformation(makeAuthorizedSignatureRequired: boolean = false): void {
        let validationType = this.form.get('allowCvapStaffSharing').value;
        let options = { onlySelf: true, emitEvent: false };
        this.authorizedPersons = this.form.get('authorizedPerson') as FormArray;
        let authPerson: FormGroup = this.authInfoHelper.createAuthorizedPerson(this.fb);

        if (validationType === 100000001) { //Yes-Person
            let agencyControl = authPerson.get('authorizedPersonAgencyName');

            this.clearControlValidators(agencyControl);

        }
        else if (validationType === 100000002) {//Yes-Agency
            let agencyControl = authPerson.get('authorizedPersonAgencyName');
            let authorizedPersonFirstNameControl = authPerson.get('authorizedPersonFirstName');
            let authorizedPersonLastNameControl = authPerson.get('authorizedPersonLastName');
            let authorizedPersonRelationshipControl = authPerson.get('authorizedPersonRelationship');

            this.setControlValidators(agencyControl, [Validators.required]);

            this.clearControlValidators(authorizedPersonFirstNameControl);
            this.clearControlValidators(authorizedPersonLastNameControl);
            this.clearControlValidators(authorizedPersonRelationshipControl);
        }
        this.authorizedPersons.push(authPerson);
        this.showAddAuthorizationInformation = this.authorizedPersons.length < 3;
        this.showRemoveAuthorization = this.authorizedPersons.length > 1;

        if (makeAuthorizedSignatureRequired) {
            let authorizedPersonSignature = this.form.get('authorizedPersonSignature');
            authorizedPersonSignature.setErrors(null, options);
            authorizedPersonSignature.setValidators([Validators.required]);
            authorizedPersonSignature.updateValueAndValidity(options);
        }
    }
    clearAuthorizationInformation(): void {
        console.log("clearAuthorizationInformation");
        // remove all AuthorizedInformation items
        this.authorizedPersons = this.form.get('authorizedPerson') as FormArray;
        while (this.authorizedPersons.length > 0) {
            this.authorizedPersons.removeAt(this.authorizedPersons.length - 1);
        }

        let authorizedPersonSignature = this.form.get('authorizedPersonSignature');
        authorizedPersonSignature.setErrors(null);
        authorizedPersonSignature.clearValidators();
        authorizedPersonSignature.updateValueAndValidity();
    }
    removeAuthorizationInformation(index: number): void {
        console.log("removeAuthorizationInformation");
        this.authorizedPersons = this.form.get('authorizedPerson') as FormArray;
        this.authorizedPersons.removeAt(index);
        this.showAddAuthorizationInformation = this.authorizedPersons.length < 3;
        this.showRemoveAuthorization = this.authorizedPersons.length > 1;
    }

    showSignPad(control): void {
        const dialogConfig = new MatDialogConfig();
        dialogConfig.disableClose = true;
        dialogConfig.autoFocus = true;

        const dialogRef = this.matDialog.open(SignPadDialog, dialogConfig);
        dialogRef.afterClosed().subscribe(
            data => {
                var patchObject = {};
                patchObject[control] = data;
                this.form.patchValue(
                    patchObject
                );
            },
            err => console.log(err)
        );
    }

    setAuthPersonPhoneValidators(authPerson: AbstractControl) {
        let phoneMinLength = 10;
        let phoneMaxLength = 15;
        if (authPerson.get('authorizedPersonAgencyAddress.country').value === 'Canada' || authPerson.get('authorizedPersonAgencyAddress.country').value === 'United States of America') {
            phoneMinLength = 10;
        }
        else {
            phoneMinLength = 8;
        }

        let phoneControl = authPerson.get('authorizedPersonPhoneNumber');
        this.setControlValidators(phoneControl, [Validators.minLength(phoneMinLength), Validators.maxLength(phoneMaxLength)]);
        phoneControl.patchValue(phoneControl.value);
    }
}
